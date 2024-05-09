# Knit

## Introduction

Knit is a web application to help you knit simple wavy scarfs.
It allows you to specify a few input parameters
concerning the scarf's length and shape
in order to generate the "pattern":
the sequence of rows that you can knit.
Knit displays a render of the scarf
(given your input parameters)
and helps you keep track of which row you're on.

![Sample scarf](images/000.jpg)

The scarf shapes (i.e., the position of increases and decreases)
are generated using Bézier curves given the input parameters.

This application state is contained entirely in the browser.
There is no server-side component or communication
(beyond just loading the static files).

You can see it in action in Github pages:
https://alefore.github.io/knit/

## Example

The following is a scarf I knit ([parameters](https://alefore.github.io/knit/#TotalLength=654&CenterWidth=26&Shape=Thin)):

![Sample scarf](images/001.jpg)

## Using Knit

In order to knit a new scarf using this software:

1. Load it from Github pages:
   https://alefore.github.io/knit/

1. Optionally, save a local copy.
   I recommend using a local copy
   as a way to freeze the version you're working on.
   I may change the implementation.
   Make sure all files (including the JavaScript logic) are saved
   and loaded from your copy
   (rather than just the `index.html` entry point).

1. Optionally, knit a small swatch to inform
   the length and width of your scarf in rows and stitches
   (e.g., if each of your rows measures 4mm,
   you'll need 250 rows for a 1m long scarf).
   This enables the software to be completely agnostic to your
   yarn width, needle size, and knitting tension.

1. Configure your scarf:
   adjust the parameters until you're satisfied.
   You can mouse over each input for more information.
   When you're satisfied, click *Knit*.

1. Knitting your scarf typically takes a few hours,
   depending on your parameters.
   Unless you plan to knit your entire scarf in a single sitting,
   consider doing a simple test before you start:
   advance a few rows in the software (without knitting),
   put your phone (or computer) away (e.g., lock it or such),
   and come back to your browser.
   Confirm that your browser correctly remembers which row you were on.

1. Start knitting.
   Cast-on 6 stitches.
   This is the left tip of your scarf.

1. Work through the rows, starting at row 0.
   Whenever you finish a row, click "Next" to advance;
   you can also press space, up or down or,
   on mobile devices, swipe left or right.

1. Bind-off the last 6 stitches.

### Display

Rows look something like this: "92↓ (13 Δ1) 2K KFB 6K WYIF 3SLP"

In this case:

* 92 is the number of row (starting at 0, so this would be the 93rd row).

* ↓ tells you the direction you're knitting in
  (relative to the render).
  You can also think of down as "right side"
  and up as "wrong side".

* (13 Δ1) tells you that you should have 13 stitches at the end of this row.
  The delta, if present, tells you that this row increases
  the number of stitches by the amount given
  (or shrinks, if negative).

* The rest are the steps for this row.

* The percentage number (shown only for the current row)
  is an estimate of how much of the scarf you've already knitted
  (at the start of this row).
  This is based on a simple calculation
  based on the number of stitches in all rows.

## Future

The following is a list of things I'd like to add:

* Clock that counts how much time you've spent in each row.
  This would help me know if I've forgotten to register completion of a row.

* More patterns.
  There's nothing in the underlying software that is specific to these scarfs.
  This should support socks and hats and …
