import { supabase } from './src/lib/supabase'
import { useEffect, useState } from 'react'

export default function Page() {
  const [todos, setTodos] = useState<any[]>([])

  useEffect(() => {
    supabase.from('todos').select().then(({ data }) => {
      if (data) setTodos(data)
    })
  }, [])

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  )
}