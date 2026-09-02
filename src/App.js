import logo from './logo.svg';
import About from './pages/About/About';
import Home from './pages/Home/Home';
import Navbar from './components/Navbar';
import './App.css';

import {BrowserRouter, Route, Routes, Navigate} from 'react-router-dom';
import Footer from './components/Footer';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <Navbar/>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
        </div>
        <Footer/>
      </BrowserRouter>
    </div>
  );
}

export default App;
