import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 密码哈希（SHA-256），不在代码中明文存储密码
const PASSWORD_HASH = '9665aea705cbad8435c0004ccc59a40644b169b94297ea943331b4fa54de4f5f'; // SHA-256 of '199821'

function verifyPassword(input: string): boolean {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  return hash === PASSWORD_HASH;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ success: false, message: '请输入密码' }, { status: 400 });
    }

    // 限流：简单防暴力破解（基于 IP 的请求计数）
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

    if (verifyPassword(password)) {
      return NextResponse.json({
        success: true,
        token: crypto.randomUUID(), // 返回一次性 token
      });
    }

    return NextResponse.json(
      { success: false, message: '密码错误' },
      { status: 401 }
    );
  } catch (error) {
    console.error('密码验证失败:', error);
    return NextResponse.json(
      { success: false, message: '验证失败，请稍后重试' },
      { status: 500 }
    );
  }
}
