import loading from "../Assets/load.gif"

function MobileMsg() {
  return (
    <div className='mobileMsg'>
        <img src={loading} className='logoMobile' alt="Loading..."></img>
        <p>Mobile devices do not support this app.</p>
    </div>
  );
}

export default MobileMsg;