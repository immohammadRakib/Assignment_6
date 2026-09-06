import { prisma } from "../../lib/prisma";
import { IMeterRechargePayload, IWalletResponse } from "./wallet.interface";
import Stripe from "stripe";
import config from "../../config";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || (config.stripe_secret_key as string),
  {
    apiVersion: "2026-08-26.dahlia" as any,
  },
);

const getCustomerBalance = async (userId: string): Promise<IWalletResponse> => {
  const customerProfile = await prisma.customer.findUnique({
    where: { userId: userId },
    select: { balance: true, meterNumber: true, accountNumber: true },
  });

  if (!customerProfile) {
    throw new Error("Customer profile not found for this logged-in user!");
  }

  return {
    success: true,
    message: "Wallet balance fetched successfully.",
    balance: customerProfile.balance || 0.0,
  };
};

const rechargeMeterBalance = async (
  payload: IMeterRechargePayload,
): Promise<IWalletResponse> => {
  const { userId, amount, meterNumber } = payload;

  if (amount <= 0) {
    throw new Error("Recharge amount must be greater than 0!");
  }

  return await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { userId: userId },
    });

    if (!customer) {
      throw new Error("Customer profile not found for this user!");
    }

    if (customer.meterNumber && customer.meterNumber !== meterNumber) {
      throw new Error(
        "Meter number mismatch! This meter is not linked to your account.",
      );
    }

    const currentBalance = customer.balance || 0.0;
    const newBalance = currentBalance + amount;

    const updatedCustomer = await tx.customer.update({
      where: { id: customer.id },
      data: {
        balance: newBalance,
      },
    });

    return {
      success: true,
      message: `⚡ Recharge Successful! BDT/USD ${amount} added to your meter.`,
      balance: updatedCustomer.balance,
    };
  });
};

const createCheckoutSession = async (
  payload: IMeterRechargePayload,
): Promise<IWalletResponse> => {
  const { userId, amount, meterNumber } = payload;

  if (amount < 0.5) {
    throw new Error(
      "Minimum payment amount for Stripe is 0.50 USD (approx. 60 BDT)",
    );
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Prepaid Meter Utility Token (Meter: ${meterNumber})`,
            description: "Smart grid automated wallet top-up solution",
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `http://localhost:5000/api/v1/wallet/stripe-success?userId=${userId}&amount=${amount}&meterNumber=${meterNumber}`,
    cancel_url: `http://localhost:5000/api/v1/wallet/stripe-cancel`,
  });

  return {
    success: true,
    message: "Stripe checkout session initialized successfully.",
    paymentUrl: session.url as string,
  };
};

export const WalletService = {
  getCustomerBalance,
  rechargeMeterBalance,
  createCheckoutSession,
};
