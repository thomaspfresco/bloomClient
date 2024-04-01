import { useState, useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useNavigate } from 'react-router-dom';
import '../App.css';

import Loading from '../Components/Loading';
import sketch from '../StyleP5/styleExplore';
import p5 from 'p5';
import * as Tone from 'tone';

import axios from 'axios';

function Explore() {

  const [dataOla, setDataOla] = useState('');
  const [dataAdeus, setDataAdeus] = useState('');

  const [loading, setLoading] = useState(false); // Initialize loading state to true
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const p5ContainerRef = useRef(null); // Initialize p5ContainerRef
  const p5InstanceRef = useRef(null); // Initialize p5InstanceRef

  const navigate = useNavigate();

  /*const saveProject = (project) => {
    setLoading(true); // Set loading state to true when myFunction is called
    // Simulate a delay with setTimeout for demonstration purpose

    setTimeout(() => {
      console.log("This function is called from p5.js");
      setLoading(false); // Set loading state to false when myFunction is done
    }, 200); // Adjust the delay as needed
  };*/

  const saveProject = async (project) => {

    const token = window.localStorage.getItem("token");

    try {
      const response = await axios.post(window.serverLink+'/save', project, {
        params: {
          token: token
        }
      });
      console.log(response.data);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const loadProject = async () => {
    setLoading(true); 
    try {

      const token = window.localStorage.getItem("token");
      
      const response = await axios.get(window.serverLink+"/load", {
        params: {
          token: token
        }
      });

      setLoading(false);
      return response.data.project;
      
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  useEffect(() => {
    const startAudioContext = () => { Tone.start(); };
    document.addEventListener('click', startAudioContext, { once: true });
    return () => { document.removeEventListener('click', startAudioContext); };
  }, []);

  useEffect(() => {
    setIsMobileDevice(isMobile);
    if (isMobileDevice) navigate("/");
  }, [isMobileDevice]); // This effect runs once on component mount
  
  useEffect(() => {
    loadProject().then((proj) => {
      if (!loading && !p5InstanceRef.current) {
        p5InstanceRef.current = new p5(sketch(saveProject,proj), p5ContainerRef.current);
      }
    }).catch((error) => {
      console.error('Error:', error);
   });
  }, []); // Only run this effect when loading changes

  useEffect(() => {
    const handleResize = () => {
      if (p5InstanceRef.current) {
        // Update canvas size on window resize
        const { clientWidth, clientHeight } = p5ContainerRef.current;
        p5InstanceRef.current.resizeCanvas(clientWidth, clientHeight);
        if (p5InstanceRef.current && p5InstanceRef.current.getResponsive) p5InstanceRef.current.getResponsive();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="canvas">
      {loading ? <Loading /> : null}
      <div ref={p5ContainerRef}></div> {/* This is where the p5.js canvas will be rendered */}
    </div>
  );
}

export default Explore;
