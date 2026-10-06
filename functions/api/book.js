export async function onRequestPost(context) {
  try {
    const request = context.request;
    const env = context.env;

    const data = await request.json();

    const requiredFields = ["name", "phone", "service", "branch"];

    for (const field of requiredFields) {
      if (!data[field] || String(data[field]).trim() === "") {
        return new Response(
          JSON.stringify({ ok: false, error: `Missing field: ${field}` }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    if (!env.DB) {
      return new Response(
        JSON.stringify({ ok: false, error: "D1 database binding is missing" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        preferred_time TEXT,
        service TEXT NOT NULL,
        branch TEXT NOT NULL,
        notes TEXT,
        utm_source TEXT,
        utm_campaign TEXT,
        utm_content TEXT,
        page_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare(`
      INSERT INTO bookings (
        client_id,
        name,
        phone,
        preferred_time,
        service,
        branch,
        notes,
        utm_source,
        utm_campaign,
        utm_content,
        page_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.client_id || "",
      String(data.name).trim(),
      String(data.phone).trim(),
      data.preferred_time || "",
      String(data.service).trim(),
      String(data.branch).trim(),
      data.notes || "",
      data.utm_source || "",
      data.utm_campaign || "",
      data.utm_content || "",
      data.page_url || ""
    ).run();

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: "Booking failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
