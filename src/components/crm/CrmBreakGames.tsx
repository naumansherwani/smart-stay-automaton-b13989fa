import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, RotateCcw, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Tic Tac Toe ───
function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const checkWinner = (b: (string | null)[]) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, bb, c] of lines) {
      if (b[a] && b[a] === b[bb] && b[a] === b[c]) return b[a];
    }
    return b.every(Boolean) ? "Draw" : null;
  };

  const handleClick = (i: number) => {
    if (board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = isX ? "X" : "O";
    setBoard(newBoard);
    setIsX(!isX);
    setWinner(checkWinner(newBoard));
  };

  // Simple AI move
  useEffect(() => {
    if (isX || winner) return;
    const empty = board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
    if (empty.length === 0) return;
    const timer = setTimeout(() => {
      const move = empty[Math.floor(Math.random() * empty.length)];
      handleClick(move);
    }, 500);
    return () => clearTimeout(timer);
  }, [isX, winner, board]);

  const reset = () => { setBoard(Array(9).fill(null)); setIsX(true); setWinner(null); };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid grid-cols-3 gap-1.5">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="w-16 h-16 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-2xl font-bold transition-colors"
          >
            <span className={cell === "X" ? "text-primary" : "text-destructive"}>{cell}</span>
          </button>
        ))}
      </div>
      {winner && (
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold">{winner === "Draw" ? "It's a draw!" : `${winner} wins!`}</span>
        </div>
      )}
      <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="h-3 w-3 mr-1" />Reset</Button>
    </div>
  );
}

// ─── Memory Match ───
function MemoryMatch() {
  const emojis = ["🎯", "🚀", "💎", "🌟", "🎨", "🎪", "🎭", "🎵"];
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const shuffle = useCallback(() => {
    const shuffled = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  }, []);

  useEffect(() => { shuffle(); }, []);

  const handleFlip = (i: number) => {
    if (flipped.length === 2 || flipped.includes(i) || matched.includes(i)) return;
    const newFlipped = [...flipped, i];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setMatched(m => [...m, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  const won = matched.length === cards.length && cards.length > 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid grid-cols-4 gap-1.5">
        {cards.map((emoji, i) => (
          <button
            key={i}
            onClick={() => handleFlip(i)}
            className={`w-14 h-14 rounded-lg flex items-center justify-center text-xl transition-all duration-300 ${
              flipped.includes(i) || matched.includes(i)
                ? "bg-primary/20 scale-105"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {(flipped.includes(i) || matched.includes(i)) ? emoji : "?"}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>Moves: {moves}</span>
        {won && <Badge className="bg-green-500">🎉 You won!</Badge>}
      </div>
      <Button size="sm" variant="outline" onClick={shuffle}><RotateCcw className="h-3 w-3 mr-1" />New Game</Button>
    </div>
  );
}

// ─── Snake Game ───
function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const dirRef = useRef({ x: 1, y: 0 });
  const gameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const GRID = 15;
  const CELL = 18;

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setStarted(true);
    const snake = [{ x: 7, y: 7 }];
    let food = spawnFood(snake);
    dirRef.current = { x: 1, y: 0 };

    if (gameRef.current) clearInterval(gameRef.current);

    gameRef.current = setInterval(() => {
      const head = { x: snake[0].x + dirRef.current.x, y: snake[0].y + dirRef.current.y };
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || snake.some(s => s.x === head.x && s.y === head.y)) {
        clearInterval(gameRef.current!);
        setGameOver(true);
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 1);
        food = spawnFood(snake);
      } else {
        snake.pop();
      }
      draw(snake, food);
    }, 150);
  };

  const spawnFood = (snake: { x: number; y: number }[]) => {
    let f;
    do { f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }; }
    while (snake.some(s => s.x === f.x && s.y === f.y));
    return f;
  };

  const draw = (snake: { x: number; y: number }[], food: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "hsl(var(--muted))";
    ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);
    ctx.fillStyle = "hsl(var(--primary))";
    snake.forEach(s => ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2));
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(food.x * CELL + 1, food.y * CELL + 1, CELL - 2, CELL - 2);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, { x: number; y: number }> = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
      };
      if (map[e.key]) {
        e.preventDefault();
        const cur = dirRef.current;
        const next = map[e.key];
        if (cur.x + next.x !== 0 || cur.y + next.y !== 0) dirRef.current = next;
      }
    };
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("keydown", handler); if (gameRef.current) clearInterval(gameRef.current); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} width={GRID * CELL} height={GRID * CELL} className="rounded-lg border border-border" />
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Score: {score}</span>
        {gameOver && <Badge variant="destructive">Game Over</Badge>}
      </div>
      <Button size="sm" onClick={startGame}>{started ? "Restart" : "Start"} Snake</Button>
      <p className="text-xs text-muted-foreground">Use arrow keys to move</p>
    </div>
  );
}

// ─── Bubble Pop ───
function BubblePop() {
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; color: string; size: number }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [playing, setPlaying] = useState(false);

  const colors = ["bg-red-400", "bg-blue-400", "bg-green-400", "bg-yellow-400", "bg-purple-400", "bg-pink-400"];

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setPlaying(true);
    setBubbles([]);
  };

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setPlaying(false); clearInterval(timer); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (!playing) return;
    const spawner = setInterval(() => {
      setBubbles(prev => {
        if (prev.length >= 12) return prev;
        return [...prev, {
          id: Date.now() + Math.random(),
          x: Math.random() * 80 + 5,
          y: Math.random() * 80 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 20 + 28,
        }];
      });
    }, 600);
    return () => clearInterval(spawner);
  }, [playing]);

  const pop = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(s => s + 1);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-64 h-64 rounded-xl bg-muted/50 border border-border overflow-hidden">
        {bubbles.map(b => (
          <button
            key={b.id}
            onClick={() => pop(b.id)}
            className={`absolute rounded-full ${b.color} opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-150 animate-bounce cursor-pointer`}
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size }}
          />
        ))}
        {!playing && timeLeft === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-1" />
              <p className="font-bold text-lg">Score: {score}</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>
      <Button size="sm" onClick={startGame}>{playing ? "Restart" : "Start"} Bubble Pop</Button>
    </div>
  );
}

// ─── Main Break Games Component ───
interface CrmBreakGamesProps {
  isOnBreak: boolean;
}

export default function CrmBreakGames({ isOnBreak }: CrmBreakGamesProps) {
  if (!isOnBreak) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-6 text-center">
          <Gamepad2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground font-medium">Break Games</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Start a break to unlock games 🎮
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ring-2 ring-yellow-500/30 bg-yellow-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gamepad2 className="h-5 w-5 text-yellow-500" />
          Break Games
          <Badge className="bg-yellow-500 text-white ml-auto">☕ Break Active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tictactoe">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="tictactoe" className="text-xs">Tic-Tac-Toe</TabsTrigger>
            <TabsTrigger value="memory" className="text-xs">Memory</TabsTrigger>
            <TabsTrigger value="snake" className="text-xs">Snake</TabsTrigger>
            <TabsTrigger value="bubble" className="text-xs">Bubble Pop</TabsTrigger>
          </TabsList>
          <TabsContent value="tictactoe" className="flex justify-center py-4"><TicTacToe /></TabsContent>
          <TabsContent value="memory" className="flex justify-center py-4"><MemoryMatch /></TabsContent>
          <TabsContent value="snake" className="flex justify-center py-4"><SnakeGame /></TabsContent>
          <TabsContent value="bubble" className="flex justify-center py-4"><BubblePop /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
