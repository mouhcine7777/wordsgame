import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Background from "./Background.jpeg";
import SquareBackground from "./square.png";
import SelectionedBackground from "./selectioned.png";
import ValidateImage from "./validate.png";
import ResetImage from "./reset.png";
import XImage from "./X.png";
import TrueImage from "./true.png";
import Num from "./num.png";

const GRID_SIZE = 10;
const wordsToFind = ["AGADIR", "SUD", "OUFELLA", "TRIK", "ATTAHADI"];

const AppWrapper = styled.div`
  background-image: url(${Background});
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
`;

const GridWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(${GRID_SIZE}, 70px);
  gap: 10px;
  justify-content: center;
`;

const GridSquare = styled.div`
  width: 70px;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: url(${(props) => {
    if (props.correct) return TrueImage;
    return props.selected || props.validated
      ? SelectionedBackground
      : SquareBackground;
  }});
  background-size: cover;
  background-position: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  position: relative;
`;

const WrongSelectionOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: ${(props) => (props.show ? "flex" : "none")};
  justify-content: center;
  align-items: center;
  background-image: url(${XImage});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 1;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
`;

const ImageButton = styled.img`
  cursor: pointer;
  width: 100px;
  height: 100px;
`;

const GameOverPopup = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 100;
`;

const App = () => {
  const [grid, setGrid] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [validatedLetters, setValidatedLetters] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [gameWon, setGameWon] = useState(false);
  const [wrongSelection, setWrongSelection] = useState(false);

  useEffect(() => {
    function generateGrid() {
      const savedGrid = localStorage.getItem("grid");
      if (savedGrid) {
        return JSON.parse(savedGrid);
      } else {
        const newGrid = createNewGrid();
        localStorage.setItem("grid", JSON.stringify(newGrid));
        return newGrid;
      }
    }

    function createNewGrid() {
      const grid = Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(""));
      wordsToFind.forEach((word) => placeWordInGrid(word, grid));
      fillRandomLetters(grid);
      return grid;
    }

    function placeWordInGrid(word, grid) {
      let placed = false;
      while (!placed) {
        const startRow = Math.floor(Math.random() * GRID_SIZE);
        const startCol = Math.floor(Math.random() * GRID_SIZE);
        const direction = Math.floor(Math.random() * 2);

        if (canPlaceWord(word, startRow, startCol, direction, grid)) {
          for (let i = 0; i < word.length; i++) {
            const row = direction === 0 ? startRow : startRow + i;
            const col = direction === 0 ? startCol + i : startCol;
            grid[row][col] = word[i];
          }
          placed = true;
        }
      }
    }

    function canPlaceWord(word, row, col, direction, grid) {
      for (let i = 0; i < word.length; i++) {
        const r = direction === 0 ? row : row + i;
        const c = direction === 0 ? col + i : col;
        if (r >= GRID_SIZE || c >= GRID_SIZE || grid[r][c] !== "") return false;
      }
      return true;
    }

    function fillRandomLetters(grid) {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (grid[row][col] === "") {
            grid[row][col] = alphabet[Math.floor(Math.random() * alphabet.length)];
          }
        }
      }
    }

    function checkGameStatus() {
      if (foundWords.length === wordsToFind.length) {
        setGameWon(true);
      }
    }

    setGrid(generateGrid());
    checkGameStatus();
  }, [foundWords]);

  const isAdjacent = (pos1, pos2) => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0);
  };

  const handleSquareClick = (row, col) => {
    if (selectedLetters.length === 0) {
      // First letter selection
      setSelectedLetters([{ row, col }]);
    } else {
      // Check if the new letter is adjacent to the last selected letter
      const lastSelected = selectedLetters[selectedLetters.length - 1];
      if (isAdjacent(lastSelected, { row, col })) {
        // Check if the selection follows a consistent direction
        if (selectedLetters.length === 1 || isConsistentDirection(selectedLetters, { row, col })) {
          setSelectedLetters([...selectedLetters, { row, col }]);
        }
      }
    }
  };

  const isConsistentDirection = (selectedLetters, newPosition) => {
    if (selectedLetters.length < 2) return true;

    const first = selectedLetters[0];
    const second = selectedLetters[1];
    const last = selectedLetters[selectedLetters.length - 1];

    // Calculate the direction vector from the first two letters
    const baseDirectionRow = second.row - first.row;
    const baseDirectionCol = second.col - first.col;

    // Calculate the direction vector from the last letter to the new position
    const newDirectionRow = newPosition.row - last.row;
    const newDirectionCol = newPosition.col - last.col;

    // Check if the new direction matches the base direction
    return (
      (Math.abs(baseDirectionRow) === Math.abs(newDirectionRow) &&
        Math.abs(baseDirectionCol) === Math.abs(newDirectionCol)) &&
      (baseDirectionRow * newDirectionRow >= 0 &&
        baseDirectionCol * newDirectionCol >= 0)
    );
  };

  const validateWord = () => {
    const selectedWord = selectedLetters
      .map(({ row, col }) => grid[row][col])
      .join("");
    if (wordsToFind.includes(selectedWord)) {
      setFoundWords([...foundWords, selectedWord]);
      setValidatedLetters((prev) => [
        ...prev,
        ...selectedLetters.map(({ row, col }) => `${row},${col}`),
      ]);
      setSelectedLetters([]);
    } else {
      setWrongSelection(true);
      setTimeout(() => {
        setWrongSelection(false);
        setSelectedLetters([]);
      }, 1000);
    }
  };

  const resetSelection = () => {
    setSelectedLetters([]);
  };

  return (
    <AppWrapper>
      <GameContainer>
        <GridWrapper>
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <GridSquare
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                selected={selectedLetters.some(
                  (letter) => letter.row === rowIndex && letter.col === colIndex
                )}
                validated={validatedLetters.includes(`${rowIndex},${colIndex}`)}
                correct={validatedLetters.includes(`${rowIndex},${colIndex}`)}
              >
                <WrongSelectionOverlay
                  show={
                    wrongSelection &&
                    selectedLetters.some(
                      (letter) =>
                        letter.row === rowIndex && letter.col === colIndex
                    )
                  }
                />
                {cell}
              </GridSquare>
            ))
          )}
        </GridWrapper>
        <ButtonWrapper>
          <ImageButton src={ValidateImage} onClick={validateWord} alt="Validate" />
          <ImageButton src={ResetImage} onClick={resetSelection} alt="Reset" />
        </ButtonWrapper>
      </GameContainer>
      {gameWon && (
        <GameOverPopup>
          <img src={Num} alt="Game Won" />
        </GameOverPopup>
      )}
    </AppWrapper>
  );
};

export default App;