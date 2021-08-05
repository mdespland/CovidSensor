thickness_border=1; //epaisseur de la languette
thickness_device=5; //epaisseur de la boite
length_border=5;
height_device=20;
length_device=25;
border=1;

cjmcu_height=14.6;
cjmcu_width=20.1;
cjmcu_security=0.3;
cjmcu_connector=3.5;
cjmcu_back=4;
cjmcu_border=2;
cjmcu_board=1.6;
cjmcu_stopper=1;

bme_height=14.1;
bme_width=11.1;
bme_security=0.3;
bme_connector=3.5;
bme_back=4;
bme_border=2;
bme_board=1.6;
bme_stopper=1;

function nbhole(length, border)=
    let(nb=floor((length)/(border)))
    (nb-(floor(nb/2)*2)==0) ? nb+1 : nb;


module box() {
    difference() {
        cube([length_device+2*length_border,thickness_device,height_device]);
        translate([0,thickness_border,0]) cube([length_border,thickness_device-2*thickness_border, height_device]);
        translate([length_device+length_border,thickness_border,0]) cube([length_border,thickness_device-2*thickness_border, height_device]);
    }
}

module grille(length, depth, height, border) {
    difference() {
        cube([length+2*border, depth+border,height+2*border]);
        translate([border,0, border]) cube([length, depth,height]);
        translate([border,border,0]) grille_holes(length-2*border, depth, height, border);
        translate([0,border,height+border]) rotate([0,90,0]) grille_holes(height-2*border, depth, length, border);
        #translate([length+border,0,height+border]) rotate([0,90,90]) grille_holes(height-2*border, length+2*border, depth, border);
    }
}

module grille_holes(length, depth, height, border) {
    nb=nbhole(length,border);
    hole=length/nb;
    /*for (j=[0:floor(nb/2)+1]) {
       for (i=[0:2]) {
          translate([(j*2*hole),i*((depth-4*border)/3+border), 0])cube([hole,(depth-4*border)/3,height+2*border]);
       }
    }*/
    for (j=[0:floor(nb/2)+1]) {
       translate([(j*2*hole),0, 0]) #cube([hole,(depth-2*border),height+2*border]);
    }
}
//#######################################################

module cjmcu811_back(height=14, width=20, security=0.2, connector=3.5, back=4, border=2, board=1.6, hole=3, hole_distance=0.5,hole_distance_bottom=1) {
    difference() {
        cube([width+2*security+2*border, back+board, height+2*security+2*border]);
        translate([border, back, border]) cube([width+2*security, board, height+2*security]);
        translate([border, 0, height+border-connector]) cube([width+2*security, back, connector+2*security]);
    }
    translate([border+security+hole_distance+hole/2, back, border+security+hole_distance_bottom+hole/2]) rotate([-90,0,0]) cylinder(d=hole-2*security, h=3*board, $fn=64);
    translate([border+security+width-hole_distance-hole/2, back, border+security+hole_distance_bottom+hole/2]) rotate([-90,0,0]) cylinder(d=hole-2*security, h=3*board, $fn=64);
}

module cjmcu811_connector(height=14, width=20, security=0.2, connector=3.5, depth=12, back=4, border=2) {
    translate([border, -depth, height+border-connector]) cube([width+2*security, depth, connector+2*security]);
}


module cjmcu811_front(height=14, width=20, security=0.2, connector=3.5, back=4, board=1.6, border=2, box_border=1 ,stopper=1,stopper_height=3) {
    difference() {
        cube([width+2*security+2*border+2*box_border, back+stopper+board, height+2*security++2*border+2*box_border]);
        translate([box_border, 0, box_border]) cube([width+2*security+2*border, back+board+stopper, height+2*security+2*border]);
        translate([border+box_border, back+board, height+border+box_border-connector]) cube([width+2*security, stopper, connector+2*security]);
        translate([border+box_border, back+board, border+box_border+security]) cube([width+2*security, stopper, height-connector+2*security-stopper_height]);
    }
}

module box_cjmcu811_back() {
    difference() {
        box();
        translate([(length_device+2*length_border-(cjmcu_width+2*cjmcu_security+2*cjmcu_border))/2,thickness_device,(height_device-(cjmcu_height+2*cjmcu_security+2*cjmcu_border))/2]) {
            cjmcu811_connector(height=cjmcu_height, width=cjmcu_width, security=cjmcu_security, back=cjmcu_back, border=cjmcu_border, depth=thickness_device);
        //cjmcu811_front();
        }
    }
    translate([(length_device+2*length_border-(cjmcu_width+2*cjmcu_security+2*cjmcu_border))/2,thickness_device,(height_device-(cjmcu_height+2*cjmcu_security+2*cjmcu_border))/2]) {
        cjmcu811_back(height=cjmcu_height, width=cjmcu_width, security=cjmcu_security, back=cjmcu_back, border=cjmcu_border);
        //cjmcu811_front();
    }
}

module box_cjmcu811_front(depth=5, border=1, box_security=0.15) {
    cjmcu811_front(height=cjmcu_height+box_security, width=cjmcu_width+box_security, security=cjmcu_security, back=cjmcu_back, border=cjmcu_border, box_border=border);
    translate([0,cjmcu_back+cjmcu_stopper+cjmcu_board-cjmcu_border,0]) grille(cjmcu_width+2*cjmcu_security+2*cjmcu_border+box_security, depth, cjmcu_height+2*cjmcu_security+2*cjmcu_border+box_security, border);
}


//#######################################################

module bme280_back(height=14, width=20, security=0.2, connector=3.5, back=4, border=2, board=1.6, hole=3, hole_distance=1,hole_distance_bottom=1.4) {
    difference() {
        cube([width+2*security+2*border, back+board, height+2*security+2*border]);
        translate([border, back, border]) cube([width+2*security, board, height+2*security]);
        translate([border, 0, height+border-connector]) cube([width+2*security, back, connector+2*security]);
        #translate([border,back-4,border])cube([width-hole_distance-hole-security,4,7]);
    }
    //translate([border+security+hole_distance+hole/2, back, border+security+hole_distance+hole/2]) rotate([-90,0,0]) cylinder(d=hole-2*security, h=3*board, $fn=64);
    translate([border+security+width-hole_distance-hole/2, back, border+security+hole_distance_bottom+hole/2]) rotate([-90,0,0]) cylinder(d=hole-2*security, h=3*board, $fn=64);
}

module bme280_connector(height=14, width=20, security=0.2, connector=3.5, depth=12, back=4, border=2) {
    translate([border, -depth, height+border-connector]) cube([width+2*security, depth, connector+2*security]);
}


module bme280_front(height=14, width=20, security=0.2, connector=3, back=4, board=1.6, border=2, box_border=1 ,stopper=1,stopper_height=3) {
    difference() {
        cube([width+2*security+2*border+2*box_border, back+stopper+board, height+2*security++2*border+2*box_border]);
        translate([box_border, 0, box_border]) cube([width+2*security+2*border, back+board+stopper, height+2*security+2*border]);
        translate([border+box_border, back+board, height+border+box_border-connector]) cube([width+2*security, stopper, connector+2*security]);
        translate([border+box_border, back+board, border+box_border+security]) cube([width+2*security, stopper, height-connector+2*security-stopper_height]);
    }
}

module box_bme280_back() {
    difference() {
        box();
        translate([(length_device+2*length_border-(bme_width+2*bme_security+2*bme_border))/2,thickness_device,(height_device-(bme_height+2*bme_security+2*bme_border))/2]) {
            bme280_connector(height=bme_height, width=bme_width, security=bme_security, back=bme_back, border=bme_border, depth=thickness_device);
            
        //bme280_front();
        }
    }
    translate([(length_device+2*length_border-(bme_width+2*bme_security+2*bme_border))/2,thickness_device,(height_device-(bme_height+2*bme_security+2*bme_border))/2]) {
        bme280_back(height=bme_height, width=bme_width, security=bme_security, back=bme_back, border=bme_border);
        //bme280_front();
    }
}

module box_bme280_front(depth=5, border=1, box_security=0.15) {
    bme280_front(height=bme_height+box_security, width=bme_width+box_security, security=bme_security, back=bme_back, border=bme_border, box_border=border);
    translate([0,bme_back+bme_stopper+bme_board-bme_border,0]) grille(bme_width+2*bme_security+2*bme_border+box_security, depth, bme_height+2*bme_security+2*bme_border+box_security, border);
}

//#######################################################

module led(security=0.3, height=8.5, diameter=5, base=5.6, base_height=1,fake_base=10) {
    if (fake_base>0) translate([0,0,-fake_base]) cylinder(d=base+security, h=fake_base,$fn=64);
    cylinder(d=base+security, h=security+base_height,$fn=64);
    translate([0,0,base_height]) cylinder(d=diameter+security, h=height-diameter/2-base_height,$fn=64);
    translate([0,0,height-diameter/2]) sphere(d=diameter+security,$fn=64);
    
}

module light(diameter=10, base=5, base_height=1, thickness=thickness_device, inside=3, border=2) {
    difference() {
        union() {
            translate([0,0,thickness+base_height-inside]) led(security=0, height=8.5+border, diameter=5+2*border, base=5.6+border,fake_base=0);
            cylinder(d=diameter, h=thickness,$fn=64);
            translate([0,0,thickness])cylinder(d=diameter+2*base, h=base_height,$fn=64);
        }
        translate([0,0,thickness+base_height-inside]) led(fake_base=thickness+base_height);
    }
    
}

//#######################################################


module screw(hole=3.1, diameter=6.5, screw_height=3.2, height=5, width=8) {
    difference() {
        translate([-width/2, -width/2, 0]) cube([width, width,height]);
        translate([0, 0, (height-screw_height)/2])cylinder(d=diameter, h=height, $fn=6);
        cylinder(d=hole,h=height,$fn=32);
    }
}


// ##############################

module support_board(hole=3.1, diam=5, height=5, width=10, base=5) {
    translate([0,0,base]) {
        difference() {
            cylinder(d=diam, h=height, $fn=32);
            cylinder(d=hole, h=height, $fn=32);   
        }
    }
    translate([0,0,base]) rotate([180,0,0]) screw(width=width, height=base);
}

module support_iC880A(diam=5,height=5, width=10, base=5) {
    translate([(width/2)-6.15,(width/2)-2.9,0]) {
        translate([6.15,2.9,0]) rotate([0,0,180])support_board(diam=diam, width=width,height=height, base=base);
        translate([61.15,2.9,0]) rotate([0,0,180])support_board(diam=diam, width=width,height=height, base=base);
        translate([6.15,76.9,0]) rotate([0,0,0]) support_board(diam=diam, width=width,height=height, base=base);
        translate([61.15,76.9,0]) rotate([0,0,0]) support_board(diam=diam, width=width,height=height, base=base);
    }
}
//border=thickness_border,outside_border=5
module box_iC880A(diam=5,height=5.2, width=10, thickness=thickness_device, border=thickness_border,outside_border=5) {
    translate([0,0,-border]) support_iC880A(diam=diam, width=width,height=height, base=thickness_device+2*border);
    translate([-border-outside_border,0,-border]) {
        difference() {
            cube([(61.15-6.15)+width+2*border+2*outside_border,(76.9-2.9)+width+border+outside_border , thickness+2*border]);
            translate([border+outside_border,0,0]) cube([(61.15-6.15)+width,(76.9-2.9)+width , thickness+2*border]);
            translate([0,(76.9-2.9)+width+border,border]) cube([(61.15-6.15)+width+2*border+2*outside_border,outside_border , thickness]);
            translate([0,0,border]) cube([outside_border,(76.9-2.9)+width+border+outside_border , thickness]);
            #translate([(61.15-6.15)+width+2*border+outside_border,0,border]) cube([outside_border,(76.9-2.9)+width+border+outside_border , thickness]);
            
        }
    }
}

// #############################

// CO2 Sensor 1.2
co2_width=32;
co2_length=42;
co2_fix_hole=3;
co2_fix_diam=6;
co2_fix_border=3.5;
co2_sensor_diam=20;
co2_sensor_length=8;
co2_sensor_top_diam=13;
co2_sensor_top_border=2;
co2_sensor_top_height=6;
co2_board_top=7;
co2_sensor_height=27;

module box_co2_protection(security=0.2,border=1, top=5,thickness=1,box_thickness=2.5) {
    height=co2_sensor_height+top-((co2_board_top+thickness+box_thickness)+(box_thickness+thickness));
    diam=co2_sensor_diam+co2_sensor_top_diam+2*co2_sensor_top_border+security;
    difference() {
        cylinder(d=diam+2*border, h=height+border, $fn=128);
        cylinder(d=diam, h=height, $fn=128);
    }
}

module segment(diam=30, height=10, angle=2, int=20) {
    difference() {
        cylinder(d=diam, h=height, $fn=128);
        cylinder(d=int, h=height, $fn=128);
    }
        
}

module round_border(diam=10, height=1) {
    difference() {
        translate([-diam/2, -diam/2, 0]) cube([diam, diam, height]);
        cylinder(d=diam, h=height, $fn=64);
        translate([-diam/2, -diam/2, 0]) cube([diam, diam/2, height]);
        translate([0, 0, 0]) cube([diam/2, diam/2, height]);
    }
}

module box_co2_sensor_top(thickness=1,border=3, width=8, height=2.5) {
    difference() {
        union() {
            translate([-width,-width,0]) cube([co2_width+2*border+2*width, co2_length+2*border+2*width, thickness]);
            difference() {
                translate([0,0,thickness]) cube([co2_width+2*border, co2_length+2*border, height]);           
                translate([border, border, thickness]) cube([co2_width, co2_length, height]);
            }
            translate([border+co2_fix_border, border+co2_fix_border, thickness]) cylinder(d=co2_fix_diam, h=height, $fn=32);
            translate([border+co2_width-co2_fix_border, border+co2_fix_border, thickness]) cylinder(d=co2_fix_diam, h=height, $fn=32);
            translate([border+co2_fix_border, border+co2_length-co2_fix_border, thickness]) cylinder(d=co2_fix_diam, h=height, $fn=32);
            translate([border+co2_width-co2_fix_border, border+co2_length-co2_fix_border, thickness]) cylinder(d=co2_fix_diam, h=height, $fn=32);
        }
        translate([border+co2_fix_border, border+co2_fix_border, 0]) cylinder(d=co2_fix_hole, h=height+thickness, $fn=32);
        translate([border+co2_width-co2_fix_border, border+co2_fix_border, 0]) cylinder(d=co2_fix_hole, h=height+thickness, $fn=32);
        translate([border+co2_fix_border, border+co2_length-co2_fix_border, 0]) cylinder(d=co2_fix_hole, h=height+thickness, $fn=32);
        translate([border+co2_width-co2_fix_border, border+co2_length-co2_fix_border, 0]) cylinder(d=co2_fix_hole, h=height+thickness, $fn=32);
        translate([border+co2_width/2, border+co2_sensor_length, 0]) cylinder(d=co2_sensor_diam, h=thickness+height, $fn=32);
        
        
        translate([-width/2,-width/2,0]) rotate([0,0,90]) round_border(diam=width, height=thickness);
        translate([co2_width+2*border+width/2,-width/2,0]) rotate([0,0,180]) round_border(diam=width, height=thickness);
        translate([co2_width+2*border+width/2,co2_length+2*border+width/2,0]) rotate([0,0,270]) round_border(diam=width, height=thickness);
        translate([-width/2,co2_length+2*border+width/2,0]) rotate([0,0,0]) round_border(diam=width, height=thickness);
    }
    difference() {
        translate([border+co2_width/2, border+co2_sensor_length, -co2_sensor_top_height]) cylinder(d=co2_sensor_diam+co2_sensor_top_diam+2*co2_sensor_top_border, h=co2_sensor_top_height, $fn=128);
        translate([border+co2_width/2, border+co2_sensor_length, -co2_sensor_top_height]) cylinder(d=co2_sensor_diam+co2_sensor_top_diam, h=co2_sensor_top_height, $fn=32);
    }
}

module box_co2_sensor_bottom(thickness=1,border=3, width=8, height=2.5) {
    picot_height=co2_board_top+thickness+height;
    difference() {
        union() {
            difference() {
                union() {
                    translate([-width,-width,0]) cube([co2_width+2*border+2*width, co2_length+2*border+2*width, thickness]);
                    translate([0,0,thickness]) cube([co2_width+2*border, co2_length+2*border, height]); 
                }          
                translate([border, border, 0]) cube([co2_width, co2_length, height+thickness]);
            }
            translate([border+co2_fix_border, border+co2_fix_border, -co2_board_top]) cylinder(d=co2_fix_diam, h=co2_board_top+height+thickness, $fn=32);
            translate([border+co2_width-co2_fix_border, border+co2_fix_border, -co2_board_top]) cylinder(d=co2_fix_diam, h=co2_board_top+height+thickness, $fn=32);
            translate([border+co2_fix_border, border+co2_length-co2_fix_border, -co2_board_top]) cylinder(d=co2_fix_diam, h=co2_board_top+height+thickness, $fn=32);
            translate([border+co2_width-co2_fix_border, border+co2_length-co2_fix_border,-co2_board_top]) cylinder(d=co2_fix_diam, h=co2_board_top+height+thickness, $fn=32);
            translate([border,border,0]) cube([co2_fix_border,co2_fix_border,height+thickness]);
            translate([border+co2_width-co2_fix_border,border,0]) cube([co2_fix_border,co2_fix_border,height+thickness]);
            translate([border,border+co2_length-co2_fix_border,0]) cube([co2_fix_border,co2_fix_border,height+thickness]);
            translate([border+co2_width-co2_fix_border,border+co2_length-co2_fix_border,0]) cube([co2_fix_border,co2_fix_border,height+thickness]);
        }
        translate([border+co2_fix_border, border+co2_fix_border, -co2_board_top]) cylinder(d=co2_fix_hole, h=co2_board_top+height+thickness, $fn=32);
        translate([border+co2_width-co2_fix_border, border+co2_fix_border, -co2_board_top]) cylinder(d=co2_fix_hole, h=co2_board_top+height+thickness, $fn=32);
        translate([border+co2_fix_border, border+co2_length-co2_fix_border, -co2_board_top]) cylinder(d=co2_fix_hole, h=co2_board_top+height+thickness, $fn=32);
        translate([border+co2_width-co2_fix_border, border+co2_length-co2_fix_border, -co2_board_top]) cylinder(d=co2_fix_hole, h=co2_board_top+height+thickness, $fn=32);
        #translate([border+co2_width/2, border+co2_sensor_length, 0]) cylinder(d=co2_sensor_diam, h=thickness+height, $fn=32);
        
    }
}


// ############################

box_cjmcu811_back();
box_cjmcu811_front();
box_bme280_back();
box_bme280_front();

box_co2_sensor_bottom();
box_co2_sensor_top();
!box_co2_protection();
round_border();
led();
light();
box_iC880A();
screw();