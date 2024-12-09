import React from 'react';

interface CardComponentProps {
  card: boolean[];
}

const colorOrder = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

const CardComponent: React.FC<CardComponentProps> = ({ card }) => {
  return (
    <div
      style={{
        backgroundColor: 'white', // White card background
        borderRadius: '15px', // Rounded edges for the card (scaled from 10px)
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)', // Subtle shadow
        width: '105px', // 1.5 times the original width (70px * 1.5)
        height: '150px', // 1.5 times the original height (100px * 1.5)
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box', // Include border and padding in dimensions
        padding: '0',
        margin: '0',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'repeat(3, 1fr)',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px', // 1.5 times the original gap (8px * 1.5)
        }}
      >
        {card.map((hasDot, index) =>
          hasDot ? (
            <div
              key={index}
              style={{
                position: 'relative',
                width: '30px', // 1.5 times the original width (20px * 1.5)
                height: '30px', // 1.5 times the original height (20px * 1.5)
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Black Circle around present dots */}
              <div
                style={{
                  position: 'absolute',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '3px solid black',
                  boxSizing: 'border-box',
                }}
              />
              {/* Dot */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: colorOrder[index],
                }}
              />
            </div>
          ) : (
            <div key={index} style={{ width: '30px', height: '30px' }} /> // Empty space
          )
        )}
      </div>
    </div>
  );
};

export default CardComponent;
