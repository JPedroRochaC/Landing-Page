import { MercadoPagoConfig, Preference, Payment, PreApproval, Invoice } from "mercadopago";

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

export const preference = new Preference(client);
export const payment = new Payment(client);
export const preApproval = new PreApproval(client);
export const invoice = new Invoice(client);
