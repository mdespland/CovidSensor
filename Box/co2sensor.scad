
module clips(height=1, support=1, lock=0.5, width=5, board=2) {
    cube([width, support, board]);
    translate([0,0,board]) triangle(width=width, length=support+lock, height=height);
}


module triangle(width=5, length=2, height=3) {
    polyhedron( points=[
          [  0,  0,  0 ],  //0
          [ width,  0,  0 ],  //1
          [ width,  length,  0 ],  //2
          [  0,  length,  0 ],  //3
          [  0,  0,  height ],  //4
          [ width,  0,  height ],  //5
          ], 
      faces=[
          [0,1,2,3],[5,4,3,2],[0,4,5,1],[0,3,4],[5,2,1]
      ]);
}

module support_board(board=2, diam=5, distance=10, height=5, picot=2, width=5, support=1) {
    cylinder(d=diam, h=height, $fn=32);
    translate([0,0,height]) cylinder(d=picot, h=board, $fn=32);
    translate([width/2,distance+support,0]) rotate([0,0,180]) clips(board=board+height, width=width, support=support);
}

module support_co2sensor(board=1.6, diam=6, distance=3.5, picot=2.5, height=10, with_bottom=false) {
    translate([3.5,3.5,0]) rotate([0,0,180])support_board(board=board, diam=diam, distance=distance, picot=picot, height=height);
    translate([38.5,3.5,0]) rotate([0,0,180])support_board(board=board, diam=diam, distance=distance, picot=picot, height=height);
    translate([3.5,28.5,0]) rotate([0,0,0]) support_board(board=board, diam=diam, distance=distance, picot=picot, height=height);
    translate([38.5,28.5,0]) rotate([0,0,0]) support_board(board=board, diam=diam, distance=distance, picot=picot, height=height);
    if (with_bottom) translate([0,-1,-1.5]) cube([85, 56+2, 1.5]);
}


module cache_co2sensor(border=2, sensor_diam=20, sensor_height=30) {
    difference() {
        union() {
            translate([-5,-1,-border]) cube([38.5+3.5+2+5, 28.5+3.5+2, border]);
            translate([8.5,(28.5+3.5)/2,-sensor_height+10-border]) cylinder(d=sensor_diam+2*border, h=sensor_height+border-10);
        }
        translate([8.5,(28.5+3.5)/2,-sensor_height+10])  cylinder(d=sensor_diam, h=sensor_height);
        translate([8.5,(28.5+3.5)/2,-sensor_height+10-border])  cylinder(d=sensor_diam/2, h=sensor_height);
        for (i=[0:20:360]) {
            translate([8.5, (28.5+3.5)/2, 0]) {
                rotate([0,0,i]) {
                #translate([(sensor_diam/4)+border, -border/2, -sensor_height+10-border]) cube([(sensor_diam/4), border, sensor_height-10]);
                }
            }
        }
    }
    support_co2sensor();
}

cache_co2sensor();