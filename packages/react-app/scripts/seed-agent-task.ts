
import { PrismaClient, TaskStatus, SubtaskType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const requestId = "test-agent-req-" + Date.now();
    console.log("Creating task with ID:", requestId);

    await prisma.task.create({
        data: {
            title: "Test Agent Task",
            description: "Verification of Agent API",
            maxParticipants: 10,
            currentParticipants: 5,
            baseReward: "1000000", // 1 USDC
            totalDeposited: "10000000",
            status: TaskStatus.ACTIVE,
            aiCriteria: "{}",
            agentRequestId: requestId,
            feedbackType: "multiple_choice",

            subtasks: {
                create: {
                    title: "Test Question",
                    type: SubtaskType.MULTIPLE_CHOICE,
                    required: true,
                    order: 1,
                    options: JSON.stringify(["Option A", "Option B"]),
                }
            }
        }
    });

    console.log("Task created successfully");
    console.log(requestId);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
