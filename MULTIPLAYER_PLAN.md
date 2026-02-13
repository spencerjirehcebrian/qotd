# Multiplayer Implementation Plan

## Overview

Add real-time multiplayer to QOTD Gen using Socket.IO on a custom Node.js server. Users join ephemeral rooms via invite links, see each other's cursors, and share a synchronized spinning wheel. No authentication -- browser-local identity only. No database changes. All room state lives in server memory.

---

## Phase 1: Custom Server + Socket.IO Setup

### 1.1 Install dependencies

```
socket.io           (server)
socket.io-client    (client)
```

### 1.2 Create custom server (`server.ts`)

A new entry point at the project root that:

- Creates a raw `http.Server`
- Attaches Socket.IO to it with CORS configured for dev/prod
- Creates the Next.js app and request handler
- Routes all non-WebSocket HTTP traffic to Next.js
- Listens on `PORT` (default 3000)

```
server.ts
├── http.createServer()
├── new Server(httpServer, { cors, ... })
├── next({ dev, ... })
├── app.prepare() → httpServer.listen()
└── Socket.IO event handlers (imported from server/socket.ts)
```

### 1.3 Update scripts and configs

- `package.json` scripts:
  - `dev` → `tsx watch server.ts` (replaces `next dev`)
  - `start` → `node server.js` (replaces `next start`)
  - Add `build:server` → `tsc server.ts` or bundle with esbuild
- `next.config.ts`: keep `output: "standalone"` -- the custom server will import from `.next/standalone`
- `Dockerfile`: update runner stage to use `server.js` instead of the Next.js standalone server
- `docker-entrypoint.sh`: update start command

### 1.4 Server-side room and socket management (`server/socket.ts`)

Core server module that manages all Socket.IO logic:

```
server/
├── socket.ts          # Main Socket.IO setup, event routing
├── rooms.ts           # Room state management (Map<roomId, RoomState>)
└── types.ts           # Shared types for socket events
```

**Room state (in-memory):**

```typescript
interface RoomState {
  id: string;                    // Short room code (e.g., "abc123")
  questions: Question[];         // Current question pool
  participants: Map<string, Participant>;
  spinLock: boolean;             // Prevents concurrent spins
  currentSpin: SpinEvent | null; // Active spin params
  createdAt: number;
}

interface Participant {
  oderId: string;        // Persistent browser ID
  socketId: string;      // Current socket connection
  name: string;
  color: string;         // Assigned color for cursor/presence
  cursor: { x: number; y: number } | null;
}
```

**Room lifecycle:**
- Rooms stored in a `Map<string, RoomState>` in server memory
- Created on first `room:create` event
- Destroyed when last participant disconnects (after 30s grace period for reconnects)
- Room codes: 6-character alphanumeric, generated server-side

---

## Phase 2: Browser Identity

### 2.1 Identity store (`src/store/useIdentityStore.ts`)

New Zustand store persisted to localStorage:

```typescript
interface IdentityState {
  oderId: string;      // crypto.randomUUID(), generated once, never changes
  name: string;        // User-chosen display name
  setName: (name: string) => void;
}
```

- On first visit: generate `oderId`, set `name` to "" (prompt user to set one)
- Name is editable from a small UI element (header bar or room lobby)
- `oderId` is sent with every Socket.IO event to identify the user across reconnects

### 2.2 Name input UI

- Simple inline-editable name field shown in the room header area
- Stored in localStorage, persists across sessions
- Sent to server on connect and on change (`identity:update` event)

---

## Phase 3: Room System

### 3.1 Socket.IO event protocol

**Client -> Server:**

| Event | Payload | Description |
|---|---|---|
| `room:create` | `{ oderId, name }` | Create new room, join it |
| `room:join` | `{ roomId, oderId, name }` | Join existing room |
| `room:leave` | `{}` | Leave current room |
| `identity:update` | `{ name }` | Update display name |
| `cursor:move` | `{ x, y }` | Cursor position update |
| `wheel:load` | `{ questions }` | Load/replace question pool for room |
| `wheel:spin` | `{}` | Request a spin |

**Server -> Client:**

| Event | Payload | Description |
|---|---|---|
| `room:created` | `{ roomId }` | Confirm room creation |
| `room:joined` | `{ roomId, state }` | Full room state on join |
| `room:participant-joined` | `{ participant }` | Someone joined |
| `room:participant-left` | `{ oderId }` | Someone left |
| `room:error` | `{ message }` | Error (room not found, etc.) |
| `presence:sync` | `{ participants[] }` | Full participant list |
| `cursor:update` | `{ oderId, x, y }` | Another user's cursor moved |
| `wheel:questions-loaded` | `{ questions }` | Question pool updated |
| `wheel:spin-start` | `{ spinId, winnerIndex, seed }` | Spin initiated, all clients animate |
| `wheel:spin-end` | `{ spinId, question }` | Spin complete, reveal question |

### 3.2 Room pages and routing

**New routes:**

- `/room` -- Lobby page: create room or enter code to join
- `/room/[code]` -- Room view: the multiplayer wheel experience

**`/room` (lobby):**
- Input field for room code + "Join" button
- "Create Room" button
- Name input if not already set
- Recent rooms list (stored in localStorage, best-effort since rooms are ephemeral)

**`/room/[code]` (room view):**
- On mount: connect Socket.IO, send `room:join`
- If room doesn't exist: show error, link back to lobby
- If connected: render the multiplayer wheel UI
- On unmount / tab close: `room:leave`

### 3.3 Socket.IO client hook (`src/hooks/useSocket.ts`)

A React hook that manages the Socket.IO connection lifecycle:

```typescript
function useSocket(roomId: string) {
  // Connect on mount, disconnect on unmount
  // Rejoin on reconnect (using oderId for identity continuity)
  // Expose: socket instance, connection status, room state
  // Handle all incoming events, dispatch to Zustand stores
}
```

### 3.4 Room state store (`src/store/useRoomStore.ts`)

New Zustand store (NOT persisted -- ephemeral like the rooms):

```typescript
interface RoomState {
  roomId: string | null;
  connected: boolean;
  participants: Participant[];
  questions: Question[];
  spinInProgress: boolean;
  currentSpinParams: SpinParams | null;
}
```

This store is the source of truth for all multiplayer state. The existing `useAppStore` continues to own solo-mode state and user preferences (filters, spin duration, etc.).

---

## Phase 4: Synchronized Wheel

### 4.1 The problem

The current wheel physics (`useWheelPhysics.ts`) is non-deterministic across clients because it uses `requestAnimationFrame` delta timing. Two clients with different frame rates will produce different results.

### 4.2 The approach: server-authoritative outcome

1. Any client sends `wheel:spin` to server
2. Server checks spin lock -- if already spinning, reject
3. Server sets spin lock, picks a winning segment index (random), generates a `seed` value
4. Server broadcasts `wheel:spin-start` with `{ winnerIndex, seed }` to all clients
5. Each client independently animates the wheel to land on `winnerIndex`:
   - Calculate the target rotation angle that places the winning segment under the pointer
   - Use the existing physics engine but override the initial velocity to one that will land in the correct zone (or use a GSAP tween fallback for consistency)
6. After animation completes (client-side), client shows the reveal
7. Server broadcasts `wheel:spin-end` after a fixed duration as a backstop (ensures all clients reveal even if animation timing drifts)
8. Server releases spin lock

### 4.3 Changes to `useWheelPhysics.ts`

Add a new mode: `spinToSegment(targetIndex: number, segmentCount: number)`

This mode:
- Calculates the exact target angle where `targetIndex` segment is under the pointer
- Adds N full rotations (randomized 4-8 spins) for visual effect
- Uses a GSAP tween with a custom ease (fast start, slow deceleration) to animate to the target
- Fires the same `onSegmentCross` callback (for click sounds) during the tween
- Fires `onSpinComplete` with the predetermined segment index at the end

This preserves the visual feel while guaranteeing all clients land on the same segment.

### 4.4 Changes to `SpinningWheel.tsx`

- In multiplayer mode, the SPIN button sends `wheel:spin` via socket instead of calling `spin()` directly
- Listen for `wheel:spin-start` and call `spinToSegment(winnerIndex)`
- Listen for `wheel:spin-end` as a fallback reveal trigger
- Disable the SPIN button when `spinInProgress` is true (from room store)
- When not in a room, everything works exactly as before (solo mode unchanged)

### 4.5 Question pool sync

- When any participant changes filters and fetches new questions, they emit `wheel:load` with the fetched questions
- Server stores the questions in room state and broadcasts `wheel:questions-loaded` to all
- All clients update their local wheel with the new questions
- On join, the server sends the current question pool in the `room:joined` payload

---

## Phase 5: Presence

### 5.1 Participant list component (`src/components/Room/ParticipantList.tsx`)

- Horizontal bar or sidebar showing connected users
- Each participant: colored dot + name
- Color assigned server-side from a fixed palette on join (stored in `Participant.color`)
- Updates reactively from `useRoomStore.participants`

### 5.2 Presence sync

- Server sends full `presence:sync` on join and periodically (every 10s as heartbeat)
- Incremental updates via `room:participant-joined` / `room:participant-left`
- Client reconciles against the room store

---

## Phase 6: Cursors

### 6.1 Cursor broadcasting

- Client listens to `mousemove` / `pointermove` on the room page
- Throttle to ~25fps (40ms intervals)
- Send `cursor:move` with `{ x, y }` as percentages of viewport (not pixels) for resolution independence
- Server relays to all other participants in the room (does NOT echo back to sender)

### 6.2 Cursor rendering (`src/components/Room/Cursors.tsx`)

- Overlay component rendered at the top level of the room page
- For each remote participant with a non-null cursor position:
  - Render a small colored arrow/pointer (matching their presence color)
  - Name label next to the pointer
  - Smooth interpolation (CSS transition or lerp) to avoid jitter
- `pointer-events: none` on the overlay so it doesn't interfere with clicks
- Cursors fade out if no update received for 3s (user likely tabbed away)

### 6.3 Performance considerations

- Cursor events are the highest-frequency traffic. Server relays without persisting.
- Socket.IO volatile emit (`socket.volatile.emit`) for cursor updates -- drop packets rather than queue them if the connection is slow
- Client-side: use `requestAnimationFrame` for rendering, not per-event re-renders
- Store cursor positions in a ref, not in Zustand state, to avoid React re-render overhead

---

## Phase 7: UI Integration

### 7.1 Navigation

- Add a "Multiplayer" button/link to the main page that navigates to `/room`
- The existing solo wheel at `/` remains completely unchanged
- Room page at `/room/[code]` renders the wheel in multiplayer mode

### 7.2 Room page layout (`src/app/room/[code]/page.tsx`)

```
┌─────────────────────────────────────────┐
│  Room: ABC123          [Copy Link]      │
│  ┌─────────────────────────────────┐    │
│  │  Participant List (horizontal)  │    │
│  └─────────────────────────────────┘    │
│                                         │
│         ┌───────────────┐               │
│         │               │               │
│         │  Spinning     │               │
│         │  Wheel        │               │
│         │               │               │
│         └───────────────┘               │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Filters (same as solo mode)    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Cursor overlay - full page, above]    │
└─────────────────────────────────────────┘
```

### 7.3 Reuse strategy

The `SpinningWheel` component and its children (`WheelCanvas`, `WheelControls`, `WheelSegment`, `QuestionReveal`) should be reused directly. The multiplayer room page passes different handlers:

- `onSpin` -> emits socket event instead of local physics
- `questions` -> from room store instead of app store
- `spinInProgress` -> from room store

Filters component is reused as-is. When filters change and questions are refetched, the result is broadcast to the room.

---

## Phase 8: Deployment and Infrastructure

### 8.1 Custom server build pipeline

- `server.ts` needs to be compiled to JS for production
- Options: `tsc` (simple), `esbuild` (fast, handles imports well), or `tsx` in prod (not recommended)
- Recommended: add `esbuild` as dev dependency, build script compiles `server.ts` + `server/*.ts` to `dist/server.js`
- Production: `node dist/server.js`

### 8.2 Dockerfile updates

```dockerfile
# Builder stage: also compile server.ts
RUN npm run build && npm run build:server

# Runner stage: copy compiled server
COPY --from=builder /app/dist/server.js ./server.js

# Update CMD
CMD ["node", "server.js"]
```

### 8.3 Standalone output compatibility

Next.js `output: "standalone"` produces a self-contained server in `.next/standalone/server.js`. The custom `server.ts` needs to import Next.js differently:

- In dev: `import next from 'next'` and use the dev server
- In prod: import the standalone Next.js handler or use `next({ dev: false })`
- This is a known pattern; Next.js custom server docs cover it

### 8.4 Environment variables

No new required env vars. Optional:

- `SOCKET_IO_PATH` -- custom path for Socket.IO (default `/socket.io`)
- `ROOM_TIMEOUT_MS` -- grace period before destroying empty rooms (default 30000)

---

## File Change Summary

### New files

| File | Purpose |
|---|---|
| `server.ts` | Custom HTTP server entry point |
| `server/socket.ts` | Socket.IO event handlers and setup |
| `server/rooms.ts` | Room state management (in-memory Map) |
| `server/types.ts` | Shared TypeScript types for socket events |
| `src/store/useIdentityStore.ts` | Browser-local user identity (Zustand, persisted) |
| `src/store/useRoomStore.ts` | Multiplayer room state (Zustand, not persisted) |
| `src/hooks/useSocket.ts` | Socket.IO client connection hook |
| `src/hooks/useCursors.ts` | Cursor tracking and broadcasting hook |
| `src/app/room/page.tsx` | Room lobby (create/join) |
| `src/app/room/[code]/page.tsx` | Multiplayer room view |
| `src/components/Room/ParticipantList.tsx` | Connected users display |
| `src/components/Room/Cursors.tsx` | Remote cursor overlay |
| `src/components/Room/RoomHeader.tsx` | Room info bar (code, copy link, name edit) |

### Modified files

| File | Change |
|---|---|
| `package.json` | Add socket.io deps, update dev/start/build scripts |
| `src/hooks/useWheelPhysics.ts` | Add `spinToSegment()` method for deterministic landing |
| `src/components/Wheel/SpinningWheel.tsx` | Accept multiplayer props, conditional spin handler |
| `src/components/Wheel/WheelControls.tsx` | Accept external `onSpin` and `disabled` props |
| `next.config.ts` | Possibly minor adjustments for custom server compat |
| `Dockerfile` | Update build and run commands for custom server |
| `docker-entrypoint.sh` | Update start command |

### Unchanged

- All Prisma schema and migrations
- All existing API routes
- All CLI code
- The solo wheel at `/` (existing behavior preserved entirely)
- `useAppStore.ts` (solo mode store, untouched)

---

## Implementation Order

1. **Server foundation** (Phase 1): Custom server, Socket.IO attached, verify Next.js still works
2. **Identity** (Phase 2): Zustand store, name input UI
3. **Room system** (Phase 3): Server room management, lobby page, join/leave flow, socket hook
4. **Synchronized wheel** (Phase 4): `spinToSegment`, multiplayer spin flow, question pool sync
5. **Presence** (Phase 5): Participant list component
6. **Cursors** (Phase 6): Broadcasting, rendering, performance tuning
7. **Polish and deployment** (Phase 7-8): UI layout, copy-link, Dockerfile, build pipeline

Each phase is independently testable. Phase 1 is a prerequisite for everything. Phases 2-3 are prerequisites for 4-6. Phases 5 and 6 are independent of each other.

---

## Open Questions / Decisions Deferred

- **Reconnection UX**: When a user reconnects, should they silently rejoin or see a "Reconnecting..." banner? (Lean toward banner.)
- **Max participants per room**: Cap at some number (e.g., 20) to limit cursor/presence traffic? Or leave uncapped for now.
- **Mobile cursors**: Touch devices don't have hover cursors. Skip cursor broadcasting on mobile, still show presence.
- **Sound sync**: Currently sound plays on peg crosses locally. In multiplayer, each client plays sound independently based on their own animation -- slight timing differences are acceptable.
