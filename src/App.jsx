import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './Pages/home'
import Explore from './Pages/explore'
import NoPage from './Pages/noPage'

import './App.css';

window.serverLink = "http://127.0.0.1:5000"
window.uploaded = false
window.trained = false

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route index element={<Home/>}/>
      <Route path="/explore" element={<Explore/>}/>
      <Route path="*" element={<NoPage/>}/>
    </Routes>
  </BrowserRouter>
  );
}

export default App;
