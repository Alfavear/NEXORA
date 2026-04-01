import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function getCsvData(filename: string, maxRows = 50) {
  const filePath = path.join('d:', 'Projects', 'Nexora', 'NEXORA', 'CSV', filename);
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const result: any[] = [];
  
  // Skip header if any, take up to maxRows
  for (let i = 1; i < lines.length && result.length < maxRows; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    
    // Very rudimentary parse to get first 3-5 columns
    result.push(parts.map(p => p.replace(/^"|"$/g, '').trim()));
  }
  return result;
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('Seeding data based on legacy CSV files...');

  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found. Make sure base seed has been run.');
    return;
  }

  const defaultBranch = await prisma.branch.findFirst({ where: { companyId: company.id } });
  const users = await prisma.user.findMany({ where: { companyId: company.id } });

  if (!defaultBranch || users.length === 0) {
     console.error('No branch or users found.');
     return;
  }

  // Ensure default Payment Method exists
  let cashPayment = await prisma.paymentMethod.findFirst({ where: { name: 'Efectivo', companyId: company.id } });
  if (!cashPayment) {
    cashPayment = await prisma.paymentMethod.create({ data: { name: 'Efectivo', companyId: company.id } });
  }

  // 1. Read and create 50 Customers from CSV
  console.log('Reading _Clientes_.csv...');
  const legacyCustomers = getCsvData('_Clientes_.csv', 50);
  const createdCustomers: any[] = [];
  for (const c of legacyCustomers) {
     if (c.length < 3) continue;
     const doc = c[2] || undefined; // usually column 2 is doc based on the sample 
     const name = c[1] || `Cliente ${createdCustomers.length}`; // col 1 is name
     try {
       const customer = await prisma.customer.create({
         data: {
           companyId: company.id,
           name: name,
           document: doc,
           phone: c[8] || undefined
         }
       });
       createdCustomers.push(customer);
     } catch (e) {
       // ignore dupes
     }
  }

  // 2. Read and create 50 Items from CSV
  let category = await prisma.itemCategory.findFirst({ where: { companyId: company.id } });
  if (!category) {
    category = await prisma.itemCategory.create({ data: { name: 'Cat CSV', companyId: company.id } });
  }

  // Ensure a default supplier exists for the items
  let defaultSupplier = await prisma.supplier.findFirst({ where: { companyId: company.id } });
  if (!defaultSupplier) {
    defaultSupplier = await prisma.supplier.create({ data: { name: 'Proveedor Legacy', companyId: company.id } });
  }

  console.log('Reading _Articulos_.csv...');
  const legacyItems = getCsvData('_Articulos_.csv', 50);
  const createdItems: any[] = [];
  for (const row of legacyItems) {
     if (row.length < 4) continue;
     const sku = row[0] || `SKU-${createdItems.length}`;
     const name = row[1] || `Producto ${createdItems.length}`;
     const price = Number(row[4]) || Math.floor(Math.random() * 100) + 10;
     try {
       const item = await prisma.item.create({
         data: {
           companyId: company.id,
           categoryId: category.id,
           providerId: defaultSupplier.id,
           name: name,
           sku: sku,
           salePrice: price,
           costPrice: price * 0.6,
           trackStock: true
         }
       });
       
       // Add stock
       await prisma.branchStock.create({
         data: {
           branchId: defaultBranch.id,
           itemId: item.id,
           quantity: 100
         }
       });

       createdItems.push(item);
     } catch (e) {
       // ignore dupes
     }
  }

  if (createdCustomers.length === 0 || createdItems.length === 0) {
    console.log('Not enough CSV data parsed, relying on existing items/customers...');
    const allC = await prisma.customer.findMany();
    const allI = await prisma.item.findMany();
    createdCustomers.push(...allC);
    createdItems.push(...allI);
  }

  if (createdCustomers.length > 0 && createdItems.length > 0) {
    console.log('Creating 100 random sales for reports...');
    const now = new Date();
    const pasMonth = new Date();
    pasMonth.setMonth(now.getMonth() - 2); // sales within last 2 months

    for (let i = 0; i < 100; i++) {
       const user = users[Math.floor(Math.random() * users.length)];
       const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
       const itemsCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
       
       let total = 0;
       const detailsData: any[] = [];
       for (let d = 0; d < itemsCount; d++) {
         const it = createdItems[Math.floor(Math.random() * createdItems.length)];
         const qty = Math.floor(Math.random() * 5) + 1;
         const sub = Number(it.salePrice) * qty;
         total += sub;
         detailsData.push({
           itemId: it.id,
           quantity: qty,
           unitPrice: it.salePrice,
           subtotal: sub,
           isGift: false
         });
       }

       const isCredit = Math.random() > 0.7; // 30% credit
       const saleDate = randomDate(pasMonth, now);
       const dueDate = new Date(saleDate);
       dueDate.setDate(dueDate.getDate() + 30);

       const paidAmount = isCredit ? 0 : total;

       const sale = await prisma.sale.create({
         data: {
           companyId: company.id,
           branchId: defaultBranch.id,
           sellerId: user.id,
           customerId: customer.id,
           systemNumber: `VTA-CSV-${Date.now()}-${i}`,
           externalReceiptNumber: `F-${1000 + i}`,
           subtotal: total,
           total: total,
           isCredit,
           dueDate: isCredit ? dueDate : null,
           paidAmount,
           outstanding: isCredit ? total : 0,
           paymentStatus: isCredit ? 'PENDING' : 'PAID',
           createdAt: saleDate,
           details: {
             create: detailsData
           }
         }
       });

       if (!isCredit) {
          await prisma.salePayment.create({
            data: {
              saleId: sale.id,
              paymentMethodId: cashPayment.id,
              amount: total,
              createdAt: saleDate
            }
          });
       } else if (Math.random() > 0.5) {
          // Add partial payment
          const partial = total * 0.3;
          const pDate = new Date(saleDate);
          pDate.setDate(pDate.getDate() + 5);
          
          await prisma.salePayment.create({
            data: {
              saleId: sale.id,
              paymentMethodId: cashPayment.id,
              amount: partial,
              createdAt: pDate,
              notes: 'Abono parcial CSV'
            }
          });

          await prisma.sale.update({
            where: { id: sale.id },
            data: {
              paidAmount: partial,
              outstanding: total - partial,
              paymentStatus: 'PARTIAL'
            }
          });
       }

       // Generate Inventory Movement for the sale
       for (const detail of detailsData) {
          await prisma.inventoryMovement.create({
            data: {
              companyId: company.id,
              branchId: defaultBranch.id,
              itemId: detail.itemId,
              createdById: user.id,
              type: 'SALE',
              quantity: detail.quantity,
              balanceAfter: 0, // Mocked for simplicity
              reference: sale.systemNumber,
              createdAt: saleDate
            }
          });
       }
    }
  }

  console.log('Seed completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
