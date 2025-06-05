import { motion } from "framer-motion"

const PixelCat = () => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="w-32 h-32 mx-auto"
    >
      <div className="pixel-cat">
        <div className="ear-left"></div>
        <div className="ear-right"></div>
        <div className="face">
          <div className="eye-left"></div>
          <div className="eye-right"></div>
          <div className="nose"></div>
        </div>
      </div>
      <style jsx>{`
        .pixel-cat {
          width: 100%;
          height: 100%;
          position: relative;
          background-color: white;
          border-radius: 50%;
          overflow: hidden;
        }
        .ear-left, .ear-right {
          width: 0;
          height: 0;
          border-left: 20px solid transparent;
          border-right: 20px solid transparent;
          border-bottom: 30px solid white;
          position: absolute;
          top: -15px;
        }
        .ear-left { left: 10px; transform: rotate(-30deg); }
        .ear-right { right: 10px; transform: rotate(30deg); }
        .face {
          position: absolute;
          width: 80%;
          height: 80%;
          top: 20%;
          left: 10%;
          background-color: white;
          border-radius: 50%;
        }
        .eye-left, .eye-right {
          width: 8px;
          height: 8px;
          background-color: black;
          border-radius: 50%;
          position: absolute;
          top: 40%;
        }
        .eye-left { left: 30%; }
        .eye-right { right: 30%; }
        .nose {
          width: 10px;
          height: 6px;
          background-color: pink;
          border-radius: 50%;
          position: absolute;
          top: 60%;
          left: 50%;
          transform: translateX(-50%);
        }
      `}</style>
    </motion.div>
  )
}

export default PixelCat

