import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Preferences', color: '#3b82f6' },
  { name: 'What If', color: '#8b5cf6' },
  { name: 'Hot Takes', color: '#ec4899' },
  { name: 'Backstory', color: '#10b981' },
  { name: 'Real Talk', color: '#ef4444' },
  { name: 'Just for Fun', color: '#f59e0b' },
  { name: 'Wildcard', color: '#f43f5e' },
];

const questions = [
  // Very Unserious (Level 1)
  { text: "If your pet could suddenly talk, what's the first thing it would roast you about?", seriousnessLevel: 1, categories: ['Just for Fun'] },
  { text: "You can only keep three apps on your phone forever -- which ones?", seriousnessLevel: 1, categories: ['Preferences'] },
  { text: "What was the first concert or live event you ever attended?", seriousnessLevel: 1, categories: ['Preferences', 'Backstory'] },
  { text: "If gravity turned off for 10 seconds right now, what would happen to you?", seriousnessLevel: 1, categories: ['What If', 'Just for Fun'] },
  { text: "Cereal is soup -- agree or disagree?", seriousnessLevel: 1, categories: ['Hot Takes', 'Just for Fun'] },

  // Unserious (Level 2)
  { text: "Invent a holiday that doesn't exist yet. What's it called and how do people celebrate?", seriousnessLevel: 2, categories: ['Just for Fun'] },
  { text: "You're stuck on a desert island with one album on repeat -- which album?", seriousnessLevel: 2, categories: ['Preferences'] },
  { text: "What's your favorite smell and why does it hit so hard?", seriousnessLevel: 2, categories: ['Preferences'] },
  { text: "If you woke up tomorrow as the CEO of any company, which one and what's your first move?", seriousnessLevel: 2, categories: ['What If'] },
  { text: "What's a movie everyone loves that you think is just okay?", seriousnessLevel: 2, categories: ['Hot Takes'] },

  // Neutral (Level 3)
  { text: "What random act of kindness from a stranger has stuck with you?", seriousnessLevel: 3, categories: ['Backstory'] },
  { text: "If you could master any skill overnight, what would it be?", seriousnessLevel: 3, categories: ['What If'] },
  { text: "What's a book, show, or game you'd recommend to literally anyone?", seriousnessLevel: 3, categories: ['Preferences'] },
  { text: "What's a hill you'll die on that most people don't care about?", seriousnessLevel: 3, categories: ['Hot Takes'] },
  { text: "You can only eat the cuisine of one country forever -- which one?", seriousnessLevel: 3, categories: ['Preferences'] },

  // Serious (Level 4)
  { text: "What's a turning point in your life that you didn't recognize until later?", seriousnessLevel: 4, categories: ['Backstory'] },
  { text: "What's one thing you wish people understood about you without you having to explain it?", seriousnessLevel: 4, categories: ['Real Talk'] },
  { text: "If you could send a one-sentence message to your 15-year-old self, what would it say?", seriousnessLevel: 4, categories: ['What If', 'Backstory'] },
  { text: "What's an unpopular opinion you hold about how society works?", seriousnessLevel: 4, categories: ['Hot Takes', 'Real Talk'] },
  { text: "What's the first big decision you made completely on your own?", seriousnessLevel: 4, categories: ['Backstory'] },

  // Very Serious (Level 5)
  { text: "What are you most afraid of that you rarely talk about?", seriousnessLevel: 5, categories: ['Real Talk'] },
  { text: "What part of your identity did you have to fight to hold onto?", seriousnessLevel: 5, categories: ['Backstory', 'Real Talk'] },
  { text: "If you could change one systemic thing about the world, what would it be?", seriousnessLevel: 5, categories: ['What If', 'Real Talk'] },
  { text: "What does living a good life actually mean to you, not what you were told it should mean?", seriousnessLevel: 5, categories: ['Real Talk'] },
  { text: "What's something you've forgiven that was really hard to forgive?", seriousnessLevel: 5, categories: ['Backstory', 'Real Talk'] },
];

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Create categories
    console.log('Creating categories...');
    const createdCategories = await Promise.all(
      categories.map(async (category) => {
        return await prisma.category.upsert({
          where: { name: category.name },
          update: {},
          create: category,
        });
      })
    );

    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create questions and their category relationships
    console.log('Creating questions...');
    for (const question of questions) {
      const createdQuestion = await prisma.question.create({
        data: {
          text: question.text,
          seriousnessLevel: question.seriousnessLevel,
        },
      });

      // Link question to categories
      for (const categoryName of question.categories) {
        const category = createdCategories.find(c => c.name === categoryName);
        if (category) {
          await prisma.questionCategory.create({
            data: {
              questionId: createdQuestion.id,
              categoryId: category.id,
            },
          });
        }
      }
    }

    console.log(`✅ Created ${questions.length} questions`);
    console.log('🎉 Database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });