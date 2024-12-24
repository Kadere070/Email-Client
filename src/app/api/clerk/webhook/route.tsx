import { db } from "@/server/db"

export const POST = async (req: Request) => {
    const {data} = await req.json()
    console.log("clerk webhook received",data)
    const emailAddress= data.email_addresses[0].email_address
    const firstName = data.first_name
    const lastName = data.last_name
    const id = data.id
    const imageUrl = data.image_url

    await db.user.create({
        data: {
            email: emailAddress,
            firstName: firstName,
            lastName: lastName,
            id: id,
           // imageUrl: imageUrl
        }
    })
    
    console.log("user created")
    return new Response('webhook received',{status: 200})
}