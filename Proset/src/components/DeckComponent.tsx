import React, { useEffect, useState } from 'react';
import CardComponent from './CardComponent';

const DeckComponent: React.FC = () => {
  const [slots, setSlots] = useState<(boolean[] | null)[]>(Array(7).fill(null)); // 7 slots for cards
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]); // Track which slots are selected for redealing
  const [remaining, setRemaining] = useState<number | null>(null); // Track the remaining cards
  const [gameOver, setGameOver] = useState(false); // Track if the game has ended
  const [startTime, setStartTime] = useState<number | null>(null); // Start time for the timer
  const [endTime, setEndTime] = useState<number | null>(null); // End time for the timer

  // Fetch a card from the server
  const fetchCard = async (): Promise<boolean[] | null> => {
    try {
      const response = await fetch('http://localhost:5000/get_card'); // Fetch a card
      if (!response.ok) throw new Error('Failed to fetch card');
      const data = await response.json();

      // Check if the game is over
      if ('done' in data) {
        setGameOver(true); // Mark the game as over
        setRemaining(0); // No cards remaining
        setEndTime(Date.now()); // Record the end time
        return null; // No card to return
      }

      setRemaining(data.remaining); // Update the remaining count
      return data.card; // Return the fetched card
    } catch (error) {
      console.error(error);
      alert('Error fetching card from server');
      return null;
    }
  };

  // Restart the game
  const restartGame = async () => {
    try {
      const response = await fetch('http://localhost:5000/restart', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to restart game');
      const data = await response.json();
      setRemaining(data.remaining); // Update the remaining cards count

      // Clear cards and borders, then delay
      setSlots(Array(7).fill(null)); // Temporarily clear the slots
      setSelectedSlots([]); // Clear selected slots
      await new Promise(resolve => setTimeout(resolve, 150)); // Add delay

      // Fetch new cards
      const newSlots = await Promise.all(
        Array(7)
          .fill(null)
          .map(async () => await fetchCard())
      );
      setSlots(newSlots);
      setSelectedSlots([]);
      setGameOver(false);
      setStartTime(Date.now()); // Reset the timer
      setEndTime(null); // Clear end time
    } catch (error) {
      console.error(error);
      alert('Error restarting the game');
    }
  };

  // Solve the current board state
  const solveBoard = async () => {
    if (gameOver) return; // Prevent solving when the game is over
    try {
      const response = await fetch('http://localhost:5000/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slots),
      });
      if (!response.ok) throw new Error('Failed to solve board');
      const data: number[] = await response.json(); // Expecting an array of indices

      // Add the solved indices to the selectedSlots state
      setSelectedSlots(data);
    } catch (error) {
      console.error(error);
      alert('Error solving the board');
    }
  };

  // Submit selected cards
  const submitSelection = async () => {
    if (gameOver) return; // Prevent submitting when the game is over

    const selectedCards = selectedSlots.map(index => slots[index]).filter(Boolean);

    try {
      const response = await fetch('http://localhost:5000/submit_cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedCards),
      });
      if (!response.ok) throw new Error('Failed to submit cards');

      const callback = await response.json(); // Boolean callback
      if (callback) {
        // Clear selected slots and borders, then delay
        const clearedSlots = slots.map((slot, index) =>
          selectedSlots.includes(index) ? null : slot
        );
        setSlots(clearedSlots); // Clear only selected slots
        setSelectedSlots([]); // Clear borders
        await new Promise(resolve => setTimeout(resolve, 150)); // Add delay

        // Redeal selected cards
        const newSlots = await Promise.all(
          slots.map(async (slot, index) => {
            if (selectedSlots.includes(index)) {
              const card = await fetchCard();
              return card;
            }
            return slot;
          })
        );
        setSlots(newSlots);
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting cards to the server');
    }
  };

  // Deal cards to all slots on app initialization
  useEffect(() => {
    const initializeGame = async () => {
      try {
        const response = await fetch('http://localhost:5000/restart', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to restart game');
        const data = await response.json();
        setRemaining(data.remaining); // Update the remaining cards count

        // Clear cards and borders, then delay
        setSlots(Array(7).fill(null)); // Temporarily clear the slots
        setSelectedSlots([]); // Clear selected slots
        await new Promise(resolve => setTimeout(resolve, 150)); // Add delay

        // Fetch 7 new cards
        const newSlots = await Promise.all(
          Array(7)
            .fill(null)
            .map(() => fetchCard())
        );
        setSlots(newSlots);
        setGameOver(false);
        setStartTime(Date.now()); // Start the timer
        setEndTime(null); // Clear end time
      } catch (error) {
        console.error(error);
        alert('Error initializing the game');
      }
    };

    initializeGame();
  }, []);

  const toggleSlotSelection = (index: number) => {
    if (gameOver) return; // Prevent selecting cards when the game is over
    setSelectedSlots(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index) // Deselect if already selected
        : [...prev, index] // Select otherwise
    );
  };

  // Calculate elapsed time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000);
    return `${minutes}m ${seconds}s`;
  };

  const [elapsedTime, setElapsedTime] = useState<number | null>(null); // State to store elapsed time

  useEffect(() => {
    if (startTime !== null && endTime === null) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime); // Update elapsed time every 1 second
      }, 1000);

      return () => clearInterval(interval); // Cleanup on unmount or when endTime is set
    } else if (startTime !== null && endTime !== null) {
      setElapsedTime(endTime - startTime); // Set final elapsed time
    }
  }, [startTime, endTime]);


  return (
    <div
      style={{
        backgroundColor: 'green', // Green background for the whole screen
        minHeight: '100vh', // Full-screen height
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      {gameOver && <h1 style={{ color: 'white', fontSize: '24px' }}>Game Over! No more cards remaining.</h1>}
      <h2 style={{ color: 'white', marginBottom: '10px' }}>
        Remaining Cards: {remaining !== null ? remaining : 'Loading...'}
      </h2>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>
        Time: {elapsedTime !== null ? formatTime(elapsedTime) : 'Loading...'}
      </h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={restartGame}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: 'white',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          Restart
        </button>
        <button
          onClick={solveBoard}
          disabled={gameOver} // Disable when the game is over
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: gameOver ? 'not-allowed' : 'pointer',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: gameOver ? '#ccc' : 'white',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          Solve
        </button>
        <button
          onClick={submitSelection}
          disabled={gameOver} // Disable when the game is over
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: gameOver ? 'not-allowed' : 'pointer',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: gameOver ? '#ccc' : 'white',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          Submit Selected Cards
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, auto)', gap: '20px' }}>
        {[0, 2, 5].map((startIndex, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            {slots.slice(startIndex, startIndex + (rowIndex === 1 ? 3 : 2)).map((card, index) => (
              <div
                key={startIndex + index}
                onClick={() => toggleSlotSelection(startIndex + index)}
                style={{
                  border: selectedSlots.includes(startIndex + index) ? '5px solid black' : 'none', // Highlight selected or solved slots
                  borderRadius: '20px',
                }}
              >
                {card ? (
                  <CardComponent card={card} />
                ) : (
                  <div style={{ width: '70px', height: '100px' }} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeckComponent;
