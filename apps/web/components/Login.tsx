'use client';

import React from 'react';

export default function Login() {
  // const [password, setPassword] = useState<string>('');
  // const [errors, setErrors] = useState<Record<string, string>>({});
  // const [loading, setLoading] = useState<boolean>(false);
  // const [isFormValid, setIsFormValid] = useState<boolean>(false);
  // const [touched, setTouched] = useState<Record<string, boolean>>({});

  // const handleBlur = (field: string) => {
  //   setTouched((prev) => ({ ...prev, [field]: true }));
  // };

  // async function handleCreatePassword() {
  //   // TODO: Implement password creation logic
  //   throw new Error('Function not implemented.');
  // }

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center">Crie sua Senha</h2>
    </>
    //   <p className="text-gray-600 text-center mb-6">Escolha uma senha segura para sua conta.</p>

    //   <div className="flex flex-col my-8">
    //     <span className="p-float-label">
    //       <InputText
    //         id="password"
    //         type="password"
    //         value={password}
    //         onChange={(e) => setPassword(e.target.value)}
    //         onBlur={() => handleBlur('password')}
    //         className={`w-full ${touched.password && errors.password ? 'p-invalid' : ''}`}
    //       />
    //       <label htmlFor="password">Senha</label>
    //     </span>
    //     {touched.password && errors.password && (
    //       <small className="text-red-500 mt-1">{errors.password}</small>
    //     )}
    //   </div>

    //   <Button
    //     className="w-full mt-8"
    //     label={loading ? 'Criando...' : 'Criar Senha'}
    //     onClick={handleCreatePassword}
    //     disabled={loading || !isFormValid}
    //   />

    //   <p className="text-sm text-center mt-4">
    //     <Link href="/forgot-password" className="text-primary underline">
    //       Esqueci minha senha
    //     </Link>
    //   </p>
  );
}
