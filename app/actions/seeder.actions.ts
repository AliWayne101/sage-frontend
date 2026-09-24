"use server";

import { seedMockData } from "@/seeder";
export async function seedMockDataAction() {
    await seedMockData();

    return {
        success: true,
        message: "Mock data seeded successfully",
    };
}