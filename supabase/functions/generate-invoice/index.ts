import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { PDFDocument, StandardFonts } from "https://cdn.skypack.dev/pdf-lib"
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts"

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    })

    // Get the session of the authenticated user
    const {
      data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get the request body
    const { orderId } = await req.json()

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", session.user.id)
      .single()

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get order items
    const { data: orderItems, error: itemsError } = await supabaseClient
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
      return new Response(JSON.stringify({ error: "Failed to fetch order items" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      return new Response(JSON.stringify({ error: "Failed to fetch user profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Generate PDF invoice
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Add invoice header
    page.drawText("Mood Store Invoice", {
      x: width / 2 - 100,
      y: height - 50,
      size: 24,
      font: boldFont,
    })

    page.drawText(`Invoice Number: ${orderId}`, {
      x: width - 200,
      y: height - 100,
      size: 10,
      font,
    })

    page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString()}`, {
      x: width - 200,
      y: height - 120,
      size: 10,
      font,
    })

    // Add customer info
    page.drawText("Customer Information:", {
      x: 50,
      y: height - 160,
      size: 14,
      font: boldFont,
    })

    page.drawText(`Name: ${profile.full_name || "Customer"}`, {
      x: 50,
      y: height - 180,
      size: 10,
      font,
    })

    page.drawText(`Email: ${session.user.email}`, {
      x: 50,
      y: height - 200,
      size: 10,
      font,
    })

    // Add order items
    page.drawText("Order Items:", {
      x: 50,
      y: height - 240,
      size: 14,
      font: boldFont,
    })

    // Add table headers
    const tableTop = height - 270
    const itemX = 50
    const descriptionX = 150
    const quantityX = 350
    const priceX = 400
    const totalX = 450

    page.drawText("Item", {
      x: itemX,
      y: tableTop,
      size: 10,
      font: boldFont,
    })

    page.drawText("Description", {
      x: descriptionX,
      y: tableTop,
      size: 10,
      font: boldFont,
    })

    page.drawText("Qty", {
      x: quantityX,
      y: tableTop,
      size: 10,
      font: boldFont,
    })

    page.drawText("Price", {
      x: priceX,
      y: tableTop,
      size: 10,
      font: boldFont,
    })

    page.drawText("Total", {
      x: totalX,
      y: tableTop,
      size: 10,
      font: boldFont,
    })

    // Add table rows
    let tableY = tableTop - 20

    orderItems.forEach((item) => {
      page.drawText(item.products.name, {
        x: itemX,
        y: tableY,
        size: 10,
        font,
      })

      page.drawText("Product", {
        x: descriptionX,
        y: tableY,
        size: 10,
        font,
      })

      page.drawText(item.quantity.toString(), {
        x: quantityX,
        y: tableY,
        size: 10,
        font,
      })

      page.drawText(`$${item.price.toFixed(2)}`, {
        x: priceX,
        y: tableY,
        size: 10,
        font,
      })

      page.drawText(`$${(item.price * item.quantity).toFixed(2)}`, {
        x: totalX,
        y: tableY,
        size: 10,
        font,
      })

      tableY -= 20
    })

    // Add total
    page.drawText("Total:", {
      x: 400,
      y: tableY - 20,
      size: 12,
      font: boldFont,
    })

    page.drawText(`$${order.total.toFixed(2)}`, {
      x: totalX,
      y: tableY - 20,
      size: 12,
      font: boldFont,
    })

    // Add footer
    page.drawText("Thank you for shopping with Mood Store!", {
      x: width / 2 - 120,
      y: 50,
      size: 10,
      font,
    })

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save()

    // Send email with PDF attachment
    const client = new SmtpClient()

    await client.connectTLS({
      hostname: Deno.env.get("SMTP_HOST") || "",
      port: Number.parseInt(Deno.env.get("SMTP_PORT") || "587"),
      username: Deno.env.get("SMTP_USER") || "",
      password: Deno.env.get("SMTP_PASSWORD") || "",
    })

    await client.send({
      from: Deno.env.get("SMTP_FROM") || "noreply@moodstore.com",
      to: session.user.email,
      subject: `Your Mood Store Invoice #${orderId}`,
      content: `
        <h1>Thank you for your order!</h1>
        <p>Your invoice is attached to this email.</p>
        <p>Order ID: ${orderId}</p>
        <p>Total: $${order.total.toFixed(2)}</p>
      `,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Your invoice is attached to this email.</p>
        <p>Order ID: ${orderId}</p>
        <p>Total: $${order.total.toFixed(2)}</p>
      `,
      attachments: [
        {
          filename: `invoice-${orderId}.pdf`,
          content: pdfBytes,
          contentType: "application/pdf",
        },
      ],
    })

    await client.close()

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

