import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import PDFDocument from "pdfkit"

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the orderId from the URL
    const url = new URL(request.url)
    const orderId = url.searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", session.user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        *,
        products (
          id,
          name,
          price
        )
      `)
      .eq("order_id", orderId)

    if (itemsError) {
      return NextResponse.json({ error: "Failed to fetch order items" }, { status: 500 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    // Generate PDF invoice
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on("data", (chunk) => chunks.push(chunk))

    // Add invoice header
    doc
      .fontSize(25)
      .text("Mood Store Invoice", { align: "center" })
      .moveDown()
      .fontSize(10)
      .text(`Invoice Number: ${orderId}`, { align: "right" })
      .text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, { align: "right" })
      .moveDown(2)

    // Add customer info
    doc
      .fontSize(14)
      .text("Customer Information:")
      .fontSize(10)
      .text(`Name: ${profile.full_name || "Customer"}`)
      .text(`Email: ${session.user.email}`)
      .moveDown(2)

    // Add order items
    doc.fontSize(14).text("Order Items:").moveDown()

    // Add table headers
    const tableTop = doc.y
    const itemX = 50
    const descriptionX = 150
    const quantityX = 350
    const priceX = 400
    const totalX = 450

    doc
      .fontSize(10)
      .text("Item", itemX, tableTop)
      .text("Description", descriptionX, tableTop)
      .text("Qty", quantityX, tableTop)
      .text("Price", priceX, tableTop)
      .text("Total", totalX, tableTop)
      .moveDown()

    // Add table rows
    let tableY = doc.y

    orderItems.forEach((item) => {
      doc
        .fontSize(10)
        .text(item.products.name, itemX, tableY, { width: 90 })
        .text("Product", descriptionX, tableY)
        .text(item.quantity.toString(), quantityX, tableY)
        .text(`${item.price.toFixed(2)}`, priceX, tableY)
        .text(`${(item.price * item.quantity).toFixed(2)}`, totalX, tableY)

      tableY = doc.y + 15
      doc.moveDown()
    })

    // Add total
    doc
      .fontSize(12)
      .text("Total:", 400, tableY)
      .text(`${order.total.toFixed(2)}`, totalX, tableY)

    // Add footer
    doc.moveDown(4).fontSize(10).text("Thank you for shopping with Mood Store!", { align: "center" })

    // Finalize PDF
    doc.end()

    // Wait for the PDF to be fully generated
    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks))
      })
    })

    // Return the PDF as a downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${orderId.slice(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating invoice:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}
