export interface Document {
  id: string
  title: string
  content: any // or more specific type based on your editor's content structure
  user_id: string
  created_at: string
  updated_at: string
} 