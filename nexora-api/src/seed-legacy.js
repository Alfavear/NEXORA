"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var fs = require("fs");
var path = require("path");
var prisma = new client_1.PrismaClient();
function getCsvData(filename, maxRows) {
    if (maxRows === void 0) { maxRows = 50; }
    var filePath = path.join('d:', 'Projects', 'Nexora', 'NEXORA', 'CSV', filename);
    if (!fs.existsSync(filePath))
        return [];
    var content = fs.readFileSync(filePath, 'utf-8');
    var lines = content.split('\n');
    var result = [];
    // Skip header if any, take up to maxRows
    for (var i = 1; i < lines.length && result.length < maxRows; i++) {
        var line = lines[i].trim();
        if (!line)
            continue;
        var parts = line.split(',');
        // Very rudimentary parse to get first 3-5 columns
        result.push(parts.map(function (p) { return p.replace(/^"|"$/g, '').trim(); }));
    }
    return result;
}
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var company, defaultBranch, users, cashPayment, legacyCustomers, createdCustomers, _i, legacyCustomers_1, c, doc, name_1, customer, e_1, category, legacyItems, createdItems, _a, legacyItems_1, row, sku, name_2, price, item, e_2, allC, allI, now, pasMonth, i, user, customer, itemsCount, total, detailsData, d, it_1, qty, sub, isCredit, saleDate, dueDate, paidAmount, sale, partial, pDate, _b, detailsData_1, detail;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('Seeding data based on legacy CSV files...');
                    return [4 /*yield*/, prisma.company.findFirst()];
                case 1:
                    company = _c.sent();
                    if (!company) {
                        console.error('No company found. Make sure base seed has been run.');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, prisma.branch.findFirst({ where: { companyId: company.id } })];
                case 2:
                    defaultBranch = _c.sent();
                    return [4 /*yield*/, prisma.user.findMany({ where: { companyId: company.id } })];
                case 3:
                    users = _c.sent();
                    if (!defaultBranch || users.length === 0) {
                        console.error('No branch or users found.');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, prisma.paymentMethod.findFirst({ where: { name: 'Efectivo', companyId: company.id } })];
                case 4:
                    cashPayment = _c.sent();
                    if (!!cashPayment) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.paymentMethod.create({ data: { name: 'Efectivo', companyId: company.id } })];
                case 5:
                    cashPayment = _c.sent();
                    _c.label = 6;
                case 6:
                    // 1. Read and create 50 Customers from CSV
                    console.log('Reading _Clientes_.csv...');
                    legacyCustomers = getCsvData('_Clientes_.csv', 50);
                    createdCustomers = [];
                    _i = 0, legacyCustomers_1 = legacyCustomers;
                    _c.label = 7;
                case 7:
                    if (!(_i < legacyCustomers_1.length)) return [3 /*break*/, 12];
                    c = legacyCustomers_1[_i];
                    if (c.length < 3)
                        return [3 /*break*/, 11];
                    doc = c[2] || undefined;
                    name_1 = c[1] || "Cliente ".concat(createdCustomers.length);
                    _c.label = 8;
                case 8:
                    _c.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, prisma.customer.create({
                            data: {
                                companyId: company.id,
                                name: name_1,
                                document: doc,
                                phone: c[8] || undefined
                            }
                        })];
                case 9:
                    customer = _c.sent();
                    createdCustomers.push(customer);
                    return [3 /*break*/, 11];
                case 10:
                    e_1 = _c.sent();
                    return [3 /*break*/, 11];
                case 11:
                    _i++;
                    return [3 /*break*/, 7];
                case 12: return [4 /*yield*/, prisma.itemCategory.findFirst({ where: { companyId: company.id } })];
                case 13:
                    category = _c.sent();
                    if (!!category) return [3 /*break*/, 15];
                    return [4 /*yield*/, prisma.itemCategory.create({ data: { name: 'Cat CSV', companyId: company.id } })];
                case 14:
                    category = _c.sent();
                    _c.label = 15;
                case 15:
                    console.log('Reading _Articulos_.csv...');
                    legacyItems = getCsvData('_Articulos_.csv', 50);
                    createdItems = [];
                    _a = 0, legacyItems_1 = legacyItems;
                    _c.label = 16;
                case 16:
                    if (!(_a < legacyItems_1.length)) return [3 /*break*/, 22];
                    row = legacyItems_1[_a];
                    if (row.length < 4)
                        return [3 /*break*/, 21];
                    sku = row[0] || "SKU-".concat(createdItems.length);
                    name_2 = row[1] || "Producto ".concat(createdItems.length);
                    price = Number(row[4]) || Math.floor(Math.random() * 100) + 10;
                    _c.label = 17;
                case 17:
                    _c.trys.push([17, 20, , 21]);
                    return [4 /*yield*/, prisma.item.create({
                            data: {
                                companyId: company.id,
                                categoryId: category.id,
                                name: name_2,
                                sku: sku,
                                salePrice: price,
                                costPrice: price * 0.6,
                                trackStock: true
                            }
                        })];
                case 18:
                    item = _c.sent();
                    // Add stock
                    return [4 /*yield*/, prisma.branchStock.create({
                            data: {
                                branchId: defaultBranch.id,
                                itemId: item.id,
                                quantity: 100
                            }
                        })];
                case 19:
                    // Add stock
                    _c.sent();
                    createdItems.push(item);
                    return [3 /*break*/, 21];
                case 20:
                    e_2 = _c.sent();
                    return [3 /*break*/, 21];
                case 21:
                    _a++;
                    return [3 /*break*/, 16];
                case 22:
                    if (!(createdCustomers.length === 0 || createdItems.length === 0)) return [3 /*break*/, 25];
                    console.log('Not enough CSV data parsed, relying on existing items/customers...');
                    return [4 /*yield*/, prisma.customer.findMany()];
                case 23:
                    allC = _c.sent();
                    return [4 /*yield*/, prisma.item.findMany()];
                case 24:
                    allI = _c.sent();
                    createdCustomers.push.apply(createdCustomers, allC);
                    createdItems.push.apply(createdItems, allI);
                    _c.label = 25;
                case 25:
                    if (!(createdCustomers.length > 0 && createdItems.length > 0)) return [3 /*break*/, 37];
                    console.log('Creating 100 random sales for reports...');
                    now = new Date();
                    pasMonth = new Date();
                    pasMonth.setMonth(now.getMonth() - 2); // sales within last 2 months
                    i = 0;
                    _c.label = 26;
                case 26:
                    if (!(i < 100)) return [3 /*break*/, 37];
                    user = users[Math.floor(Math.random() * users.length)];
                    customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
                    itemsCount = Math.floor(Math.random() * 3) + 1;
                    total = 0;
                    detailsData = [];
                    for (d = 0; d < itemsCount; d++) {
                        it_1 = createdItems[Math.floor(Math.random() * createdItems.length)];
                        qty = Math.floor(Math.random() * 5) + 1;
                        sub = Number(it_1.salePrice) * qty;
                        total += sub;
                        detailsData.push({
                            itemId: it_1.id,
                            quantity: qty,
                            unitPrice: it_1.salePrice,
                            subtotal: sub,
                            isGift: false
                        });
                    }
                    isCredit = Math.random() > 0.7;
                    saleDate = randomDate(pasMonth, now);
                    dueDate = new Date(saleDate);
                    dueDate.setDate(dueDate.getDate() + 30);
                    paidAmount = isCredit ? 0 : total;
                    return [4 /*yield*/, prisma.sale.create({
                            data: {
                                companyId: company.id,
                                branchId: defaultBranch.id,
                                sellerId: user.id,
                                customerId: customer.id,
                                systemNumber: "VTA-CSV-".concat(Date.now(), "-").concat(i),
                                externalReceiptNumber: "F-".concat(1000 + i),
                                subtotal: total,
                                total: total,
                                isCredit: isCredit,
                                dueDate: isCredit ? dueDate : null,
                                paidAmount: paidAmount,
                                outstanding: isCredit ? total : 0,
                                paymentStatus: isCredit ? 'PENDING' : 'PAID',
                                createdAt: saleDate,
                                details: {
                                    create: detailsData
                                }
                            }
                        })];
                case 27:
                    sale = _c.sent();
                    if (!!isCredit) return [3 /*break*/, 29];
                    return [4 /*yield*/, prisma.salePayment.create({
                            data: {
                                saleId: sale.id,
                                paymentMethodId: cashPayment.id,
                                amount: total,
                                createdAt: saleDate
                            }
                        })];
                case 28:
                    _c.sent();
                    return [3 /*break*/, 32];
                case 29:
                    if (!(Math.random() > 0.5)) return [3 /*break*/, 32];
                    partial = total * 0.3;
                    pDate = new Date(saleDate);
                    pDate.setDate(pDate.getDate() + 5);
                    return [4 /*yield*/, prisma.salePayment.create({
                            data: {
                                saleId: sale.id,
                                paymentMethodId: cashPayment.id,
                                amount: partial,
                                createdAt: pDate,
                                notes: 'Abono parcial CSV'
                            }
                        })];
                case 30:
                    _c.sent();
                    return [4 /*yield*/, prisma.sale.update({
                            where: { id: sale.id },
                            data: {
                                paidAmount: partial,
                                outstanding: total - partial,
                                paymentStatus: 'PARTIAL'
                            }
                        })];
                case 31:
                    _c.sent();
                    _c.label = 32;
                case 32:
                    _b = 0, detailsData_1 = detailsData;
                    _c.label = 33;
                case 33:
                    if (!(_b < detailsData_1.length)) return [3 /*break*/, 36];
                    detail = detailsData_1[_b];
                    return [4 /*yield*/, prisma.inventoryMovement.create({
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
                        })];
                case 34:
                    _c.sent();
                    _c.label = 35;
                case 35:
                    _b++;
                    return [3 /*break*/, 33];
                case 36:
                    i++;
                    return [3 /*break*/, 26];
                case 37:
                    console.log('Seed completed successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (e) {
    console.error(e);
    process.exit(1);
}).finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
