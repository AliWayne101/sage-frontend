"use server";

import { HashPassword } from "@/lib/serverUtils";
import { seedMockData } from "@/seeder";
export async function seedMockDataAction() {
    await seedMockData();

    return {
        success: true,
        message: "Mock data seeded successfully",
    };
}

export async function generatePassword() {
    const password = await HashPassword("123");
    console.log(password);
}