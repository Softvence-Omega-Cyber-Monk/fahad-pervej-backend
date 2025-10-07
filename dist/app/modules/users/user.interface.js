"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = exports.ShippingLocation = exports.ProductCategory = void 0;
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["ANALGESICS"] = "Analgesics";
    ProductCategory["ANTIBIOTICS"] = "Antibiotics";
    ProductCategory["CARDIOVASCULAR_MEDICATIONS"] = "Cardiovascular Medications";
    ProductCategory["ANTIDIABETIC_MEDICATIONS"] = "Antidiabetic Medications";
    ProductCategory["CENTRAL_NERVOUS_SYSTEM"] = "Central Nervous System";
    ProductCategory["ALL"] = "All";
})(ProductCategory || (exports.ProductCategory = ProductCategory = {}));
var ShippingLocation;
(function (ShippingLocation) {
    ShippingLocation["LOCAL"] = "Local within city state";
    ShippingLocation["NATIONAL"] = "National within country";
    ShippingLocation["INTERNATIONAL"] = "International";
})(ShippingLocation || (exports.ShippingLocation = ShippingLocation = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["BANK_ACCOUNT"] = "Bank Account";
    PaymentMethod["PAYPAL"] = "Paypal";
    PaymentMethod["STRIPE"] = "Stripe";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
