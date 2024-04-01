import loading from "../Assets/load.gif"

function MobileMsg() {
  return (
    <div className='mobileMsg'>
        <img src={loading} className='logoMobile' alt="Loading..."></img>
        <p>This app do not support mobile devices.</p>
    </div>
  );
}

export default MobileMsg;