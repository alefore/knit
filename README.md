# Knit

## Introduction

Knit is a web application to help you knit simple wavy scarfs.
It allows you to specify a few input parameters
about the length and shape of the scarf
in order to generate the "pattern":
the sequence of rows that you can knit.
Knit displays a render of the scarf
(given your input parameters)
and helps you keep track of which row you're on.

The scarf shapes (i.e., the position of increases and decreases)
are generated using Bézier curves given the input parameters.

## Caveats

I've mostly tested this on a laptop.
I've tried to add some rudimentary support for mobile interfaces,
but I don't know how well it works.

## Using Knit

In order to knit a new scarf using this software:

1. Load it from the Github page:
   https://alefore.github.io/knit/

2. Save a local copy.
   I recommend using a local copy
   as a way to freeze the version you're working on.
   I may change the implementation.

3. Play with the parameters (at the top of the screen,
   clock "Update")
   until you're satisfied.
   I recommend you knit a small swatch to get gauge;
   that would let you know how many rows/stitches you want your scarf to have.

4. Cast-on 6 stitches.
   This is the left tip of your scarf.

5. Work through the rows.
   Start at row 0.
   Whenever you finish a row, press space
   (or, on mobile, swipe left or use the "Prev" and "Next" buttons)
   to move to the next row.

### Display

Rows look something like this: "92↓ (13 Δ1) 2K KFB 6K WYIF 3SLP"

In this case:

* 92 is the number of row (starting at 0, so this would be the 93rd row).

* ↓ tells you the direction you're knitting in
  (relative to the render).
  You can also think of down as "right side"
  and up as "wrong side".

* (13 Δ1) tells you that this row ends with 13 stitches.
  The delta tells you that this row grows the number of stitches
  by the amount given
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
