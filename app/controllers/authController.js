import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
};

// Endpoint de registro
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    const errors = {};

    if (!name || !name.trim()) {
      errors.name = 'El nombre es requerido';
    } else if (name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!email || !email.trim()) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!validateEmail(email)) {
      errors.email = 'Ingresa un correo electrónico válido';
    }

    if (!password) {
      errors.password = 'La contraseña es requerida';
    } else if (!validatePassword(password)) {
      errors.password = 'La contraseña debe tener mínimo 8 caracteres e incluir letras y números';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Debes confirmar tu contraseña';
    } else if (password && password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        errors: {
          email: 'El correo electrónico ya está registrado'
        }
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: userResponse
    });
  } catch (error) {
    console.error('Error en registro:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        errors: {
          email: 'El correo electrónico ya está registrado'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al registrar el usuario'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = {};

    if (!email || !email.trim()) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!validateEmail(email)) {
      errors.email = 'Ingresa un correo electrónico válido';
    }

    if (!password) {
      errors.password = 'La contraseña es requerida';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        errors: {
          email: 'Credenciales inválidas'
        }
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        errors: {
          password: 'Credenciales inválidas'
        }
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      data: userResponse
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión'
    });
  }
};
