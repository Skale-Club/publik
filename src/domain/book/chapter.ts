export interface Chapter {
  id: string
  bookId: string
  title: string
  order: number
  content: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ChapterWithBook extends Chapter {
  bookTitle: string
}

export interface CreateChapterInput {
  title: string
  content?: string
}

export interface UpdateChapterInput {
  title?: string
  content?: string
  order?: number
}
