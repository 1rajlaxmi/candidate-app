import { useState } from 'react';
import '../styles/globals.css';

export default function Home() {
  const [formData, setFormData] = useState({ name: '', email: '', linkedin: '', skills: '', experience: '', resume: null });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, resume: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => formDataToSend.append(key, formData[key]));

    const res = await fetch('/api/upload', { method: 'POST', body: formDataToSend });
    const data = await res.json();
    setResponse(data);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow-lg rounded-lg">
  <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
    Candidate Application
  </h1>
  <form
    onSubmit={handleSubmit}
    className="flex flex-col gap-4 bg-gray-50 p-6 rounded-lg shadow-md"
  >
    <input
      name="name"
      placeholder="Full Name"
      onChange={handleChange}
      required
      className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
    />
    <input
      type="email"
      name="email"
      placeholder="Email Address"
      onChange={handleChange}
      required
      className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
    />
    <input
      name="linkedin"
      placeholder="LinkedIn Profile URL"
      onChange={handleChange}
      required
      className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
    />
    <textarea
      name="skills"
      placeholder="List your skills..."
      onChange={handleChange}
      required
      className="border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 outline-none"
    />
    <textarea
      name="experience"
      placeholder="Briefly describe your experience..."
      onChange={handleChange}
      required
      className="border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 outline-none"
    />
    <input
      type="file"
      onChange={handleFileChange}
      required
      className="border border-gray-300 rounded-lg p-3 bg-white cursor-pointer file:bg-blue-500 file:text-white file:px-4 file:py-2 file:rounded-lg file:border-none file:cursor-pointer hover:file:bg-blue-600"
    />
    <button
      type="submit"
      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition duration-200"
    >
      Submit Application
    </button>
  </form>
  {loading && <p className="text-blue-600 text-center mt-4">Processing...</p>}
  {response && (
    <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
      {JSON.stringify(response, null, 2)}
    </pre>
  )}
</div>

  );
}