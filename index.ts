import { BehaviorSubject, fromEvent, interval, merge, Subject } from "rxjs";
import { scan, switchMap, take, takeWhile, tap } from "rxjs/operators";

class Game {
  static readonly boardWidth = 40;
  static readonly boardHeight = 20;

  private speedInMs$: Subject<number> = new BehaviorSubject(550);
  private score$: Subject<number> = new BehaviorSubject(0);
  private counter = 0;
  private state = [];

  private getRandomLetter(): string {
    return String.fromCharCode(
      Math.random() * ("z".charCodeAt(0) - "a".charCodeAt(0)) +
        "a".charCodeAt(0)
    );
  }

  private printBoard(board: Letter[]): void {
    let content = "";

    for (let i = 0; i < Game.boardHeight; i++) {
      if (board[i]) {
        content =
          "&nbsp".repeat(board[i].xPosition) + board[i].char + "<br>" + content;
      } else {
        content += "<br>";
      }
    }
    content += "-".repeat(Game.boardWidth);
    content += '<br><span>score: </span><span id="score"></span>';

    document.body.innerHTML = content;
  }

  private getLetterXPosition(): number {
    return Math.floor(Math.random() * Game.boardWidth);
  }

  startGame(): void {
    this.state = [];
    this.score$.next(0);
    this.speedInMs$.next(550);

    this.speedInMs$
      .pipe(
        switchMap((ms: number) =>
          merge(
            interval(ms),
            fromEvent<KeyboardEvent>(document, "keypress")
          ).pipe(
            scan<number, Letter[]>((acc, cur) => {
              if (typeof cur === "number") {
                return acc.concat({
                  char: this.getRandomLetter(),
                  xPosition: this.getLetterXPosition()
                });
              } else {
                if (acc[0] && (cur as KeyboardEvent).key === acc[0].char) {
                  this.score$
                    .pipe(take(1))
                    .subscribe(score => this.score$.next(score + 10));
                  if (++this.counter === 20) {
                    this.state = acc.slice(1);
                    this.counter = 0;
                    this.speedInMs$.next(ms - 25);
                  }
                  return acc.slice(1);
                } else return acc;
              }
            }, this.state)
          )
        ),
        tap(val => this.printBoard(val)),
        takeWhile(val => val.length < Game.boardHeight),
        switchMap(() =>
          this.score$.pipe(
            tap(
              score =>
                (document.getElementById(
                  "score"
                ).textContent = score.toString())
            ),
            take(1)
          )
        )
      )
      .subscribe(() => {}, () => {}, () => this.gameOver());
  }

  private gameOver() {
    document.body.innerHTML =
      '<p>Game Over</p><p id="score"></p><button id="new_game_button">New Game</button>';
    this.score$
      .pipe(take(1))
      .subscribe(
        score =>
          (document.getElementById("score").textContent = score.toString())
      );
    document
      .getElementById("new_game_button")
      .addEventListener("click", () => this.startGame());
  }
}

interface Letter {
  char: string;
  xPosition: number;
}

const a = new Game();
a.startGame();
