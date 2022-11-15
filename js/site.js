import { setupWorker, 
    asyncRun, 
    passSharedBuffer, 
    sendMessageToWorker,
    interruptExecution,
    clearInterruptBuffer
} from "./py-worker.js";

const init_main = () => {
    // set option if url has option
    const params = new URLSearchParams(window.location.search);
    const example = params.get('example');
    if (example) {
        const examples = document.getElementById('examples');
        for (let i = 0; i < examples.options.length; i++) {
            if (examples.options[i].text == example) {
                examples.value = i;
                window.update_terminal();
                break;
            }
        }
    }
    const canvas = document.getElementById('theCanvas');
    // add objects array
    canvas._objects = [];
    // set up for mouse movement
    window.lastMouse = {x: 0, y: 0};
    canvas.addEventListener("mousemove", mouseMove, false)

    // set up for mouse button
    window.lastMouseDown = {x: 0, y: 0};
    canvas.addEventListener("mousedown", mouseDown, false)

    setupWorker();
}

window.init_main = init_main;

const mouseMove = (event) => {
    const canvas = document.getElementById('theCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
    if (x > canvas.width + 1) {
        x = 0;
    }
    const y = Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
    if (y > canvas.height + 1) {
        y = 0;
    }
    window.lastMouse = {x: x, y: y};
}

const mouseDown = (event) => {
    const canvas = document.getElementById('theCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
    if (x > canvas.width + 1) {
        x = 0;
    }
    const y = Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
    if (y > canvas.height + 1) {
        y = 0;
    }
    window.lastMouseDown = {x: x, y: y};
}

async function python_runner(script, context) {
    // Shared buffers are not easily allowed any more...
    // Must have correct headers (see .htaccess)
    window.sharedBuf = new SharedArrayBuffer(65536);
    window.sharedArr = new Uint8Array(window.sharedBuf);

    window.waitBuf = new SharedArrayBuffer(4);
    window.waitArr = new Int32Array(window.waitBuf);
    // initialize
    for (let i = 0; i < 65536; i++) {
        Atomics.store(window.sharedArr, i, 0);
    }
    Atomics.store(window.waitArr, 0, 0);
    passSharedBuffer(window.sharedBuf, window.waitBuf);
    try {
        const { results, error } = await asyncRun(script, context);
        if (results) {
            console.log("pyodideWorker return results: ", results);
        } else if (error) {
            console.log("pyodideWorker error: ", error);
            // put partial error in the terminal
            if (error.startsWith('Traceback')) {
                const firstNewline = error.indexOf('\n');
                const firstUsefulError = error.indexOf('  File "<exec>"');
                const terminal = document.getElementById("console-output");
                terminal.value += '\n' + error.substring(0, firstNewline + 1) 
                    + error.substring(firstUsefulError);
                terminal.blur();
                terminal.focus();
            }
            clearInterruptBuffer();
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`
        );
    }
}

///// 

window.get_input = () => {
    window.reset_console();
    const context = {}; // we might use this to pass parameters to a program,
    // e.g. { name: "Chris", num: 5, arr: [1, 2, 3], }
    const code = document.getElementById('code').value;
    python_runner(code, context);
}

window.reset_console = () => {
    if (window.codeRunning) {
        interruptExecution();
    }
    document.getElementById('console-output').value = '';
    const canvas = document.getElementById('theCanvas');
    canvas._objects = [];
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

window.interruptExecution = () => {
    interruptExecution();
    console.log("stopping program");
}

window.update_terminal = () => {
    const snippets = [`print('Hello, World!')`,

        `first_number = int(input("Please type a number: "))
second_number = int(input("Please type another number: "))
result = first_number + second_number
print(f"The sum of {first_number} + {second_number} = {result}")`,

        `def main():
    size = int(input("Size of triangle (5-21)? "))
    triangle(size)

def triangle(n):
    for i in range(0, n, 2):
        for j in range((n - i) // 2):
            print(' ', end='')
        for j in range(i + 1):
            print('*', end='')
        print()

if __name__ == '__main__':
    main()`,
        `import time
for i in range(10):
    print(i)
    time.sleep(1)`,
        `def main():
    print('in main()')
    nextFunc()

def nextFunc():
    print("about to divide by zero...")
    a = 1 / 0

if __name__ == "__main__":
    main()`,
        `import time
    main()`,
        `import time
def main():
    canvas = Canvas()
    # Move your mouse around the white canvas!
    while True:
        mouseX = canvas.get_mouse_x()
        mouseY = canvas.get_mouse_y()
        canvas.create_oval(mouseX, mouseY, mouseX + 20, mouseY + 20, fill="blue", color="blue")
        time.sleep(0.2)

if __name__ == "__main__":
    main()` ,
        `import time
import random
import math

canvas = Canvas()
PLAY_DIFFICULTY = 5 # (0-10) lower is easier 
                    # decrease PLAY_DIFFICULTY for a slower ball
PADDLE_WIDTH = 10
PADDLE_HEIGHT = 40
PADDLE_MARGIN = 10
LEFT_PADDLE_X = PADDLE_MARGIN 
RIGHT_PADDLE_X = canvas.width - PADDLE_MARGIN
PADDLE_COLOR = 'green'
BALL_RADIUS = 10
BALL_COLOR = 'blue'
BALL_VELOCITY = 10

def main():
    print("Move the mouse up and down")
    print("inside the white box to play!")
    ball = setup_game()
    play(ball)

def setup_game():
    draw_paddles(canvas.height / 2, canvas.height / 2)
    ball = {}
    ball['x'] = canvas.width / 2
    ball['y'] = canvas.height / 2
    ball['dx'] = random.randint(5, 9)
    if random.randint(0, 1) % 2 == 0: ball['dx'] *= -1

    ball['dy'] = math.sqrt(BALL_VELOCITY ** 2 - ball['dx'] ** 2) 
    if random.randint(0, 1) % 2 == 0: ball['dy'] *= -1

    draw_ball(ball)

    return ball
    

def draw_paddles(leftY, rightY):
    canvas.fill_rect(LEFT_PADDLE_X, 
                       leftY - PADDLE_HEIGHT / 2, 
                       PADDLE_WIDTH, 
                       PADDLE_HEIGHT,
                       PADDLE_COLOR)
    
    canvas.fill_rect(RIGHT_PADDLE_X - PADDLE_WIDTH, 
                       rightY - PADDLE_HEIGHT / 2, 
                       PADDLE_WIDTH, 
                       PADDLE_HEIGHT,
                       PADDLE_COLOR)

def draw_ball(ball):
    canvas.fill_circle(ball['x'] - BALL_RADIUS, ball['y'] - BALL_RADIUS, 
                       BALL_RADIUS, BALL_COLOR)

def move_ball(ball):
    ball['x'] += ball['dx']
    ball['y'] += ball['dy']
    # bounce at ceiling and floor
    if ball['y'] < BALL_RADIUS:
        ball['dy'] = abs(ball['dy'])
    if ball['y'] > canvas.height:
        ball['dy'] = -abs(ball['dy'])

def bounce_off_paddles(ball, left_y, right_y):
    # if any part of the ball is touching the paddle, bounce
    # left
    if (LEFT_PADDLE_X <= ball['x'] - BALL_RADIUS 
                     <= LEFT_PADDLE_X + PADDLE_WIDTH and
        left_y - PADDLE_HEIGHT <= ball['y'] - BALL_RADIUS <= left_y + PADDLE_HEIGHT):
        bounce_and_fuzz(ball, 1)

    # right
    if RIGHT_PADDLE_X - PADDLE_WIDTH <= ball['x'] <= RIGHT_PADDLE_X:
        bounce_and_fuzz(ball, -1)

def bounce_and_fuzz(ball, final_direction):
    if final_direction == -1: 
        ball['dx'] = -abs(ball['dx']) 
    else:
        ball['dx'] = abs(ball['dx'])
    if ball['dx'] < 0:
        ball['dx'] = max(-9, min(-4, ball['dx'] + random.randint(-3, 3)))
    else:
        ball['dx'] = max(4, min(4, ball['dx'] + random.randint(-3, 3)))
    fix_speed(ball)

def fix_speed(ball):
    # change dy to match dx
    dy_neg = ball['dy'] < 0
    ball['dy'] = math.sqrt(BALL_VELOCITY ** 2 - ball['dx'] ** 2) 
    if dy_neg:
        ball['dy'] *= -1

def score_and_reset(ball, score):
    # if the ball is outside the bounds of the canvas,
    # someone scored
    if ball['x'] < 0:
        # score for right player
        score[1] += 1
        canvas.erase()
        ball = setup_game()
    elif ball['x'] > canvas.width:
        # score for left player
        score[0] += 1
        canvas.erase()
        ball = setup_game()

    return ball



def play(ball):
    score = [0, 0]
    while True:
        canvas.erase()
        draw_ball(ball)
        last_mouse_y = canvas.get_mouse_y()
        draw_paddles(last_mouse_y, ball['y'])
        bounce_off_paddles(ball, last_mouse_y, ball['y'])
        score_str = f"{score[0]} | {score[1]}" 
        canvas.draw_string(canvas.width / 2 - 20, 20, score_str, 'black')
        time.sleep((11 - PLAY_DIFFICULTY) * 0.005)
        move_ball(ball)
        ball = score_and_reset(ball, score)

if __name__ == "__main__":
    main()
`,
        `import time

NUM_TO_CONNECT = 4
NUM_COLS = 7 
NUM_ROWS = 6 
COLOR1 = "red" 
COLOR2 = "yellow"

# graphics
START_X = 10
START_Y = 20
BACKGROUND_COLOR = "white"
BOARD_COLOR = "blue"
DROP_RATE = 5

def print_board(board):
    # top
    for i in range(NUM_COLS):
        print(f' {i}', end='')
    print()
    print('-' * (len(board[0]) * 2 + 1))
    for row in board:
        for piece in row:
            if piece is None:
                ch = ' '
            else:
                ch = piece[0].upper()
            print(f"|{ch}", end='')
        print('|')
    # bottom 
    print(f"-" * (len(board[0]) * 2 + 1))
    print(f"|{' ' * (len(board[0]) * 2 - 1)}|")

def drop_piece(board, col, color):
    """
    This is a bit tricky, because we have rows in our board.
    We need to look at the col in each row and stop when
    we get to the bottom of the board
    Special case: top row is not None: cannot put a piece there
    """
    row = 0
    while row < NUM_ROWS and board[row][col] is None:
        row += 1
    if row > 0 and board[row - 1][col] is None:
        board[row - 1][col] = color
        return True
    return False # full column, could not place piece 

def remove_piece(board, col):
    """
    Nice function to have for testing strategies
    """
    # find the first row that has a piece in that column
    for row in board:
        if row[col]:
            # and remove it
            row[col] = None
            return

def we_have_a_winner(board, num_to_connect):
    """
    determines if there is a winner
    returns a dict with a 'start_row', a 'start_col',
    a 'direction' of 'horizontal', 'vertical', 'diag_up', or 'diag_down'
    and the 'winner', or None if there is no winning NUM_TO_CONNECT-token sequence
    e.g., {'start_row': 0, 'start_col': 1, 'direction': 'diagonal': 'winner': 'red'}
    """
    for row_num in range(len(board)):
        for col_num in range(len(board[0])):
            for fn in [check_for_row_win, check_for_col_win, 
                       check_for_diag_down_win, check_for_diag_up_win]:
                winner = fn(board, row_num, col_num, num_to_connect)
                if winner:
                    return winner
    return None

def check_for_row_win(board, row_num, col_num, num_to_connect):
    row = board[row_num]
    color = row[col_num]
    # if there aren't four more in the row, or there isn't a piece,
    # we don't have a winner
    if col_num > len(row) - num_to_connect or color is None:
        return None

    for c in range(num_to_connect - 1): # only need to find three more
        if row[c + col_num + 1] != color:
            return None

    return populate_winner(row_num, col_num, 'horizontal', color)

def check_for_col_win(board, row_num, col_num, num_to_connect):
    row = board[row_num]
    color = row[col_num]
    # if there aren't four more in the col, or there isn't a piece,
    # we don't have a winner
    if row_num > len(board) - num_to_connect or color is None:
        return None

    for r in range(num_to_connect - 1): # only need to find three more
        row = board[r + row_num + 1]
        if row[col_num] != color:
            return None

    return populate_winner(row_num, col_num, 'vertical', color)

def check_for_diag_down_win(board, row_num, col_num, num_to_connect):
    row = board[row_num]
    color = row[col_num]
    # if there aren't four more in the row or col, or there isn't a piece,
    # we don't have a winner
    if (row_num > len(board) - num_to_connect or 
          col_num > len(row) - num_to_connect or 
          color is None):
        return None

    for r in range(num_to_connect - 1): # only need to find three more
        row = board[r + row_num + 1]
        if row[col_num + r + 1] != color:
            return None

    return populate_winner(row_num, col_num, 'diag_down', color)

def check_for_diag_up_win(board, row_num, col_num, num_to_connect):
    row = board[row_num]
    color = row[col_num]
    # if there aren't four more in the row or col, or there isn't a piece,
    # we don't have a winner
    if (row_num < num_to_connect - 1 or 
          col_num > len(row) - num_to_connect or 
          color is None):
        return None

    for r in range(num_to_connect - 1): # only need to find three more
        row = board[row_num - r - 1]
        if row[col_num + r + 1] != color:
            return None

    return populate_winner(row_num, col_num, 'diag_up', color)

def find_open_spots(board, no_drop_columns, color):
    """
    Here, we see if there are any rows that have a space between two opposing player
    tokens
    """
    # start from the top row
    for row in range(len(board)):
        # no need to check last two columns
        for col in range(len(board[0]) - 2):
            if col + 1 not in no_drop_columns and board[row][col] == color:
                # check the row below, and one column over
                # if there is a token, this is a possible play
                if (row == len(board) - 1 or board[row + 1][col + 1] is not None):
                    # check the second column for a blank
                    if board[row][col + 1] is None:
                        # check the third column over
                        if board[row][col + 2] == color:
                            # we found one!
                            return col + 1
    return None
                
def populate_winner(row_num, col_num, direction, winner):
    return {
            'start_row': row_num, 
            'start_col': col_num, 
            'direction': direction, 
            'winner': winner,
            }

def play_turn(board, color):
    print_board(board)
    print(f"It is the {color} player's turn.")
    while True:
        try:
            col = int(input("Please choose a column: "))
            if 0 <= col < len(board[0]) and drop_piece(board, col, color):
                 return col
        except ValueError:
            pass

def copy_board(board):
    """
    make a deep copy of the board
    """
    new_board = []
    for row in range(len(board)):
        new_row = []
        for col in range(len(board[0])):
            new_row.append(board[row][col])
        new_board.append(new_row)
    return new_board

def ai_turn(board, color, other_color):
    # go in a winning space if we can
    col = col_to_win(board, color)
    if col is not None:
        drop_piece(board, col, color)
        return col
    
    # we must block our opponent from a win 
    col = col_to_win(board, other_color)
    if col is not None:
        drop_piece(board, col, color)
        return col

    # find columns that would lead 
    # to an immediate win if we dropped there
    no_drop_columns = []
    for our_col in range(len(board[0])):
        # drop a piece into a column
        full_c1 = not drop_piece(board, our_col, color)
        if not full_c1:
            # now drop the opponent's piece into each column
            # in turn and see if it produces a win
            for opponent_col in range(len(board[0])):
                full_c2 = not drop_piece(board, opponent_col, other_color)
                if not full_c2:
                    winner = we_have_a_winner(board, NUM_TO_CONNECT)
                    # remove other player's test piece
                    remove_piece(board, opponent_col)
                    if winner:
                        no_drop_columns.append(our_col)
                        break
            remove_piece(board, our_col)
        else:
            no_drop_columns.append(our_col)

    # if there are any open spots between two opposing player tokens, go there
    col = find_open_spots(board, no_drop_columns, other_color)
    if col is not None:
        drop_piece(board, col, color)
        return col 

    # if there are two in a row (for 4-win) with space on both sides, 
    # block to avoid easy three-in-a-row situation
    # we only have to check one side
    # this function still needs work
    for row_num in range(len(board)):
        for col_num in range(len(board[0])):
            row_check = check_for_row_win(board, row_num, col_num, 
                                          NUM_TO_CONNECT - 2)
            if row_check:
                if (row_check['start_col'] != 0 and 
                    board[row_check['start_row']]
                    [row_check['start_col'] - 1] is None):
                    col = row_check['start_col'] - 1
                    if col not in no_drop_columns:
                        drop_piece(board, col, color)
                        return col 
            
    # we can't find a good spot, so we'll just start from
    # the center and place one where we can, but not
    # in a no_drop column
    # Why the center? So if we're the starting player,
    # we go in the center!
    # Special case: no good columns (we lose) :(
    if len(no_drop_columns) == len(board[0]):
        # just remove them
        no_drop_columns = []
        print("The AI will lose!")
    col = len(board[0]) // 2
    while True:
        if col not in no_drop_columns and drop_piece(board, col, color):
            return col
        col = (col + 1) % len(board[0])

def col_to_win(board, color):
    for col in range(len(board[0])):
        test_board = copy_board(board)
        drop_piece(test_board, col, color)
        possible_winner = we_have_a_winner(test_board, NUM_TO_CONNECT)
        if possible_winner:
            return col
    return None

def print_report(player1_turns, player2_turns, turn_number):
    print(f"Player 1 made the following turns: {player1_turns}")
    print(f"Player 2 made the following turns: {player2_turns}")
    print(f"The game took {turn_number} of turns")


# Graphics routines
def get_circle_coords(canvas, row, col):
    inset_perc = 0.8
    width = canvas.width - 2 * START_X
    height = canvas.height - 2 * START_Y
    block_height = height / NUM_ROWS
    block_width = width / NUM_COLS
    y_offset = (block_height - block_height * inset_perc) / 2
    x_offset = (block_width - block_height * inset_perc) / 2
    radius = block_height * inset_perc
    return (START_X + x_offset + block_width * col,
            START_Y + y_offset + block_height * row,
            radius)

def draw_board(canvas, board):
    canvas.fill_rect(0, 0, canvas.width, canvas.height, BACKGROUND_COLOR)
    width = canvas.width - 2 * START_X
    height = canvas.height - 2 * START_Y
    canvas.fill_rect(START_X, START_Y, width, height, BOARD_COLOR)
    block_height = height / NUM_ROWS
    block_width = width / NUM_COLS
    for row in range(NUM_ROWS + 1):
        canvas.draw_line(START_X, START_Y + block_height * row,
                         START_X + width, START_Y + block_height * row, "black")
    for col in range(NUM_COLS + 1):
        canvas.draw_line(START_X + block_width * col, START_Y,
                         START_X + block_width * col, START_Y + height, "black")
    for row in range(NUM_ROWS):
        for col in range(NUM_COLS):
            x, y, radius = get_circle_coords(canvas, row, col)
            if board[row][col] is None:
                circle_color = "white"
            else:
                circle_color = board[row][col] 
            canvas.fill_circle(x, y, radius, circle_color)

def draw_drop(canvas, board, col, color):
    # remove the last piece from the board
    remove_piece(board, col)
    row = 0
    while row < NUM_ROWS and board[row][col] is None:
        row += 1
    if row > 0 and board[row - 1][col] is None:
        x, last_y, radius = get_circle_coords(canvas, row - 1, col)
        start_y = last_y % DROP_RATE
        while start_y <= last_y:
            draw_board(canvas, board)
            canvas.fill_circle(x, start_y, radius, color)
            time.sleep(0.01)
            start_y += DROP_RATE
        drop_piece(board, col, color)
        return True
    drop_piece(board, col, color)
    return False 

def click_in_col(canvas):
    x = canvas.get_mouse_down()[0]
    if x != -1:
        width = canvas.width - 2 * START_X
        height = canvas.height - 2 * START_Y
        block_height = height / NUM_ROWS
        block_width = width / NUM_COLS
        
        for col in range(NUM_COLS):
            left_x = START_X + block_width * col
            right_x = START_X + block_width * (col + 1)
            if left_x <= x < right_x:
                return col
    return -1

# end of graphics routines

def main():
    player_turns = []
    # the following are wins for the player: 
    # player_turns = [3, 2, 5, 3, 4, 1, 1, 6, 0, 0, 4, 2, 2]
    # player_turns = [3, 2, 1, 2, 1, 2, 3, 4, 4, 5, 5, 1, 1, 2, 2, 6, 4]
    # player_turns = [1, 2, 4, 3, 2, 1, 4, 5, 1, 1, 1, 5, 5, 4, 2]

    # the following player turns produces a tie:
    # player_turns = [3, 3, 3, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 4, 4, 5, 5, 5, 5, 6, 6]
    canvas = Canvas()
    board = []
    # Even though it is harder to drop a piece through a column
    # we'll stick with the traditional board with rows 
    for row in range(NUM_ROWS):
        new_row = []
        for col in range(NUM_COLS):
            new_row.append(None)
        board.append(new_row)

    turn_number = 1
    player1_turns = []
    player2_turns = []
    while turn_number < NUM_COLS * NUM_ROWS + 1:
        draw_board(canvas, board)
        print(f"Turn {turn_number}. ", end='')
        if turn_number % 2 == 1:
            color = COLOR1
            if len(player_turns) > 0:
                col = player_turns.pop(0) 
                drop_piece(board, col, color)
            else:
                # col = play_turn(board, color)
                print_board(board)
                print("Click in a column to play...")
                while True:
                    col = click_in_col(canvas)
                    if col != -1:
                        drop_piece(board, col, color)
                        print(f"You played in column {col}.")
                        break
                    time.sleep(0.05)
            draw_drop(canvas, board, col, color)
            player1_turns.append(col)
            print_board(board)
        else:
            print(f"It is the AI's turn.")
            color = COLOR2
            col = ai_turn(board, color, COLOR1)
            draw_drop(canvas, board, col, color)
            player2_turns.append(col)
            print(f"AI played in column {col}.")
        turn_number += 1
        winner = we_have_a_winner(board, NUM_TO_CONNECT)
        if winner:
            print("Winner!")
            print(winner)
            print_report(player1_turns, player2_turns, turn_number)
            draw_board(canvas, board)
            player_won = turn_number % 2 == 0
            if player_won:
                canvas.draw_string(10, 15, "Game over! You beat the AI!") 
            else:
                canvas.draw_string(10, 15, "Game over! You got beat by an AI!") 

            print_board(board)
            break 

        if None not in board[0]:
            print("The board is full and you tied!")
            print_report(player1_turns, player2_turns, turn_number)
            draw_board(canvas, board)
            canvas.draw_string(10, 15, "Game over! You tied the AI!") 
            print_board(board)
            break

if __name__ == "__main__":
    main()
`,
    ]

    const value = document.getElementById('examples').value;
    const console = document.getElementById('code');
    console.value = snippets[value]; 
}

