"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSession } from "next-auth/react"

interface LabSubmissionFormProps {
  labId: string
  studentId: string
  courseId: string
}

export default function LabSubmissionForm({ labId, studentId, courseId }: LabSubmissionFormProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Будь ласка, виберіть файл для завантаження")
      return
    }

    try {
      setUploading(true)
      setError("")
      setSuccess(false)

      const session = await getSession()
      const token = session?.accessToken

      const formData = new FormData()
      formData.append("file", file)
      formData.append("studentId", studentId)
      formData.append("labId", labId)

      const response = await fetch("/api/lab-submission", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Сталася помилка при завантаженні")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/courses/${courseId}`)
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error("Помилка при відправленні роботи:", err)
      setError(`Не вдалося завантажити роботу: ${err instanceof Error ? err.message : "Невідома помилка"}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Завантаження роботи</h3>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

      {success ? (
        <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">
          Роботу успішно завантажено! Викладач отримає її на перевірку.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="submission-file" className="block text-gray-700 mb-2">
              Виберіть файл з виконаною роботою
            </label>
            <input
              id="submission-file"
              type="file"
              onChange={handleFileChange}
              className="w-full border rounded-md p-2"
              disabled={uploading}
              accept=".pdf,.zip,.rar,.doc,.docx,.txt"
            />
            <p className="text-sm text-gray-500 mt-1">Підтримувані формати: .pdf, .zip, .rar, .doc, .docx, .txt</p>
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {uploading ? "Завантаження..." : "Відправити роботу"}
          </button>
        </form>
      )}
    </div>
  )
}
