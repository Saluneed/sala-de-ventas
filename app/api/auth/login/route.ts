import { NextRequest, NextResponse } from 'next/server';
import { getUser, createUser } from '@/lib/db';
import { comparePassword, generateToken, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, register } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y password requeridos' },
        { status: 400 }
      );
    }

    if (register) {
      if (!name) {
        return NextResponse.json(
          { error: 'Nombre requerido para registro' },
          { status: 400 }
        );
      }

      const existingUser = await getUser(email);
      if (existingUser) {
        return NextResponse.json(
          { error: 'El email ya existe' },
          { status: 400 }
        );
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await createUser(email, hashedPassword, name);
      const token = generateToken(newUser.id, newUser.email);

      return NextResponse.json({
        success: true,
        token,
        user: { id: newUser.id, email: newUser.email, name: newUser.name }
      });
    }

    const user = await getUser(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Email o password incorrectos' },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email o password incorrectos' },
        { status: 401 }
      );
    }

    const token = generateToken(user.id, user.email);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        modeUnlocked: user.mode_unlocked
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}