import { NextRequest, NextResponse } from 'next/server';

interface CalendarEvent {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  reminders: Array<{
    method: 'popup' | 'email';
    minutes: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, event }: { accessToken: string; event: CalendarEvent } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    // サーバーサイドでGoogle Calendar APIを呼び出し
    const calendarEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime,
        timeZone: 'Asia/Tokyo', // または動的に設定
      },
      end: {
        dateTime: event.endTime,
        timeZone: 'Asia/Tokyo',
      },
      reminders: {
        useDefault: false,
        overrides: event.reminders,
      },
    };

    console.log('Creating calendar event:', calendarEvent);
    
    // 日本語文字を含むJSONを適切にエンコード
    const requestBody = JSON.stringify(calendarEvent);
    const encoder = new TextEncoder();
    const encodedBody = encoder.encode(requestBody);
    
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
      },
      body: encodedBody,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Calendar API error: ${errorData.error?.message || response.statusText}`);
    }

    const createdEvent = await response.json();
    return NextResponse.json({ eventId: createdEvent.id });

  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { accessToken, eventId, reminders } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    console.log('Updating calendar settings with reminders:', reminders);

    if (eventId === 'default') {
      // カレンダーのデフォルトリマインダーを更新
      const requestBody = JSON.stringify({
        defaultReminders: reminders
      });
      const encoder = new TextEncoder();
      const encodedBody = encoder.encode(requestBody);
      
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
        },
        body: encodedBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Calendar API error:', errorData);
        throw new Error(`Calendar API error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('Calendar default reminders updated:', result);
      return NextResponse.json({ success: true });
    } else {
      // 特定のイベントのリマインダーを更新
      const requestBody = JSON.stringify({
        reminders: {
          useDefault: false,
          overrides: reminders
        }
      });
      const encoder = new TextEncoder();
      const encodedBody = encoder.encode(requestBody);
      
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
        },
        body: encodedBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Event update API error:', errorData);
        throw new Error(`Event API error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('Event reminders updated:', result.id);
      return NextResponse.json({ success: true, eventId: result.id });
    }

  } catch (error) {
    console.error('Failed to update calendar/event settings:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar/event settings' },
      { status: 500 }
    );
  }
}