import pc from "picocolors";

export function success(msg: string) {
  console.log(pc.green(msg));
}

export function error(msg: string) {
  console.error(pc.red("Error: " + msg));
}

export function info(msg: string) {
  console.log(pc.cyan(msg));
}

export function warn(msg: string) {
  console.log(pc.yellow(msg));
}
