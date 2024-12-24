import { db } from "./server/db";

await db.user.create({
    data: {
        email: "9H9rP@example.com",
        firstName: "John",
        lastName: "Doe",
    },
});

console.log('done');