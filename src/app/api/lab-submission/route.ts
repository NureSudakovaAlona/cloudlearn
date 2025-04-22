import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Ініціалізація адмін клієнта Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const studentId = formData.get("studentId") as string
    const labId = formData.get("labId") as string

    if (!file || !studentId || !labId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (session.user.id !== studentId && session.user.role !== "teacher") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${studentId}/${labId}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from("lab-submissions")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload failed:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { error: dbError } = await supabase.from("submissions").insert({
      student_id: studentId,
      lab_id: labId,
      file_path: filePath,
      submitted_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("DB insert error:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, filePath })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
