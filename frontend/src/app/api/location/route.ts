import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/location`, {
      headers: {
        'X-Forwarded-For': request.ip || request.headers.get('x-forwarded-for') || '',
      },
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json({ country: null }, { status: 500 })
  }
}
