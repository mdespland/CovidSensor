

module board() {
    difference() {
        import("/Users/marcdespland/Downloads/lora32&kit32.stl");
        translate([-30,5,-15]) cube([60,30,30]);
    }
}

module boardnousb() {
    difference() {
        import("/Users/marcdespland/Downloads/lora32&kit32.stl");
        translate([-30,1.5,-15]) cube([60,30,30]);
    }
}

module support_screen() {
    translate([0,-10,0]) {
        difference() {
            import("/Users/marcdespland/Downloads/lora32&kit32.stl");
            translate([-30,0,-15]) cube([60,10,30]);
            translate([-30,20,-15]) cube([60,10,30]);
        }
    }
}

module screen() {
    translate([0,-20,0]) {
        difference() {
            import("/Users/marcdespland/Downloads/lora32&kit32.stl");
            translate([-30,0,-15]) cube([60,20,30]);
        }
    }
}

module box() {
    box_height=26;
    scalefactor=1.01;
    scalefactor_inf=0.98;
    scalfactor_support=3.7;
    difference() {
        translate([-30,-1,-box_height/2]) cube([60,9,box_height]);
        scale([scalefactor,scalefactor,scalefactor])boardnousb();
        translate([0,-1,0])scale([2,1,scalefactor_inf]) board();
        translate([0,1,0])scale([scalefactor_inf,scalfactor_support,scalefactor_inf]) boardnousb();
        scale([scalefactor,1,scalefactor])support_screen();
        scale([scalefactor,1,scalefactor]) screen();
        translate([0,1,0]) scale([scalefactor,1,scalefactor]) screen();
        #translate([22,-5,-7]) cube([10,10,14]);
    }
}
box();
