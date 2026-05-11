
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkSchema() {
  const { data, error } = await supabase
    .from('match_events')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error fetching match_events:', error)
  } else {
    console.log('Success fetching match_events, columns:', data.length > 0 ? Object.keys(data[0]) : 'no rows')
  }
}

checkSchema()
