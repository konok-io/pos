const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create currencies
  const currencies = await Promise.all([
    prisma.currency.upsert({
      where: { code: 'BDT' },
      update: {},
      create: {
        code: 'BDT',
        name: 'Bangladeshi Taka',
        symbol: '৳',
        exchangeRate: 1,
        isBase: true,
        decimalPlaces: 0,
      },
    }),
    prisma.currency.upsert({
      where: { code: 'USD' },
      update: {},
      create: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        exchangeRate: 110,
        isBase: false,
        decimalPlaces: 2,
      },
    }),
    prisma.currency.upsert({
      where: { code: 'EUR' },
      update: {},
      create: {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        exchangeRate: 120,
        isBase: false,
        decimalPlaces: 2,
      },
    }),
  ]);
  console.log('✅ Currencies created:', currencies.length);

  // Create default store
  const store = await prisma.store.upsert({
    where: { code: 'MAIN001' },
    update: {},
    create: {
      name: 'মূল শাখা',
      code: 'MAIN001',
      address: 'ঢাকা, বাংলাদেশ',
      phone: '+880 1XXX-XXXXXX',
      email: 'main@pos.test',
      invoicePrefix: 'INV',
      isActive: true,
    },
  });
  console.log('✅ Store created:', store.name);

  // Add BDT as default currency for the store
  await prisma.storeCurrency.upsert({
    where: {
      storeId_currencyId: {
        storeId: store.id,
        currencyId: currencies[0].id,
      },
    },
    update: {},
    create: {
      storeId: store.id,
      currencyId: currencies[0].id,
      rate: 1,
      isDefault: true,
    },
  });
  console.log('✅ Store currency linked');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-food' },
      update: {},
      create: { id: 'cat-food', name: 'খাবার', icon: '🍔', storeId: store.id },
    }),
    prisma.category.upsert({
      where: { id: 'cat-drinks' },
      update: {},
      create: { id: 'cat-drinks', name: 'পানীয়', icon: '🥤', storeId: store.id },
    }),
    prisma.category.upsert({
      where: { id: 'cat-essentials' },
      update: {},
      create: { id: 'cat-essentials', name: 'প্রয়োজনীয়', icon: '🛒', storeId: store.id },
    }),
    prisma.category.upsert({
      where: { id: 'cat-medicine' },
      update: {},
      create: { id: 'cat-medicine', name: 'ওষুধ', icon: '💊', storeId: store.id },
    }),
  ]);
  console.log('✅ Categories created:', categories.length);

  // Create products
  const products = [
    { name: 'সাদা ভাত', code: 'RICE001', sellPrice: 120, costPrice: 80, stock: 50, categoryId: 'cat-food', image: '🍚', unit: 'প্লেট' },
    { name: 'পোলাও', code: 'RICE002', sellPrice: 150, costPrice: 100, stock: 30, categoryId: 'cat-food', image: '🍛', unit: 'প্লেট' },
    { name: 'চিকেন কর্ন', code: 'CHK001', sellPrice: 200, costPrice: 130, stock: 25, categoryId: 'cat-food', image: '🍗', unit: 'পিস' },
    { name: 'ফ্রাইড রাইস', code: 'FR001', sellPrice: 130, costPrice: 85, stock: 40, categoryId: 'cat-food', image: '🍜', unit: 'প্লেট' },
    { name: 'সসেজ', code: 'SAG001', sellPrice: 80, costPrice: 50, stock: 60, categoryId: 'cat-food', image: '🌭', unit: 'পিস' },
    { name: 'কোকা কোলা', code: 'COKE001', sellPrice: 30, costPrice: 20, stock: 100, categoryId: 'cat-drinks', image: '🥤', unit: 'বোতল' },
    { name: 'পেপসি', code: 'PEP001', sellPrice: 25, costPrice: 15, stock: 80, categoryId: 'cat-drinks', image: '🥤', unit: 'বোতল' },
    { name: 'স্প্রাইট', code: 'SPR001', sellPrice: 25, costPrice: 15, stock: 75, categoryId: 'cat-drinks', image: '🥤', unit: 'বোতল' },
    { name: 'মিনারেল ওয়াটার', code: 'MIN001', sellPrice: 20, costPrice: 12, stock: 150, categoryId: 'cat-drinks', image: '💧', unit: 'বোতল' },
    { name: 'চা', code: 'TEA001', sellPrice: 15, costPrice: 8, stock: 200, categoryId: 'cat-drinks', image: '☕', unit: 'কাপ' },
    { name: 'সাবান', code: 'SOAP001', sellPrice: 45, costPrice: 30, stock: 50, categoryId: 'cat-essentials', image: '🧼', unit: 'পিস' },
    { name: 'শ্যাম্পু', code: 'SHAM001', sellPrice: 150, costPrice: 100, stock: 30, categoryId: 'cat-essentials', image: '🧴', unit: 'বোতল' },
    { name: 'টুথপেস্ট', code: 'TP001', sellPrice: 85, costPrice: 55, stock: 40, categoryId: 'cat-essentials', image: '🪥', unit: 'টিউব' },
    { name: 'পারফিউম', code: 'PERF001', sellPrice: 350, costPrice: 220, stock: 15, categoryId: 'cat-essentials', image: '🌸', unit: 'বোতল' },
    { name: 'স্মোকিং বিয়ার', code: 'SMO001', sellPrice: 10, costPrice: 5, stock: 200, categoryId: 'cat-essentials', image: '🧴', unit: 'পিস' },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { storeId_code: { storeId: store.id, code: product.code } },
      update: {},
      create: { ...product, storeId: store.id },
    });
  }
  console.log('✅ Products created:', products.length);

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@pos.test' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@pos.test',
      password: 'admin123',
      role: 'admin',
      storeId: store.id,
    },
  });
  console.log('✅ Admin user created');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
