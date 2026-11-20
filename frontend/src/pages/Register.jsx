import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    register(name, email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3ECDF]">
      <div className="bg-[#FFFDF9] p-8 rounded-xl shadow-lg w-full max-w-md border border-[#E4D9C3]">
        <h2 className="text-3xl font-bold text-center text-[#2B2A28] mb-6 font-sans">Create an Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#6B655A] mb-1">Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full p-3 border border-[#E4D9C3] rounded-lg bg-[#F3ECDF] focus:outline-none focus:border-[#6656E0]"
              required 
            />
          </div>
          <div>
            <label className="block text-[#6B655A] mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full p-3 border border-[#E4D9C3] rounded-lg bg-[#F3ECDF] focus:outline-none focus:border-[#6656E0]"
              required 
            />
          </div>
          <div>
            <label className="block text-[#6B655A] mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-3 border border-[#E4D9C3] rounded-lg bg-[#F3ECDF] focus:outline-none focus:border-[#6656E0]"
              required 
            />
          </div>
          <button type="submit" className="w-full bg-[#6656E0] text-white p-3 rounded-lg font-semibold hover:bg-opacity-90 transition">
            Sign Up
          </button>
        </form>
        <p className="text-center mt-4 text-[#6B655A]">
          Already have an account? <Link to="/login" className="text-[#6656E0] font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
}