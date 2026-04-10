import EventEmitter from "node:events";



export const emailEvent = new EventEmitter({});


emailEvent.on("sendEmail", async (emailFn) => {
    try {
        await emailFn();
    } catch (error) {
        console.log(`Fail to Sent User Email ${error}`)
    }
})