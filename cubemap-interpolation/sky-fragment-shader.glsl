precision mediump float;
varying vec3 v_texcoord;

#define Gamma 1.4

#define Rayleigh 1.
#define Mie 1.
#define RayleighAtt 1.
#define MieAtt 1.2
const float g = -0.93;

#if 1
vec3 _betaR = vec3(1.95e-2, 1.1e-1, 2.94e-1); 
vec3 _betaM = vec3(4e-2, 4e-2, 4e-2);
#else
vec3 _betaR = vec3(6.95e-2, 1.18e-1, 2.44e-1); 
vec3 _betaM = vec3(4e-2, 4e-2, 4e-2);
#endif

vec3 calcAtmosphericScattering( float sR, float sM, out vec3 extinction, float cosine, float g1)
{
    extinction = exp(-(_betaR * sR + _betaM * sM));

    // scattering phase
    float g2 = g1 * g1;
    float fcos2 = cosine * cosine;
    float miePhase = Mie * pow(1. + g2 + 2. * g1 * cosine, -1.5) * (1. - g2) / (2. + g2);
    //g = 0;
    float rayleighPhase = Rayleigh;

    vec3 inScatter = (1. + fcos2) * vec3(rayleighPhase + _betaM / _betaR * miePhase);
    
    return inScatter;
}
vec3 ACESFilm( vec3 x ) {
    float tA = 2.51;
    float tB = 0.03;
    float tC = 2.43;
    float tD = 0.59;
    float tE = 0.14;
    return clamp((x*(tA*x+tB))/(x*(tC*x+tD)+tE),0.0,1.0);
}
vec3 getSkyColor(in vec3 rd, vec3 light1) {
    float sundot = clamp(dot(rd,light1),0.0,1.0);
    
    vec3 extinction;

    // optical depth -> zenithAngle
    float zenithAngle = max(0., rd.y); //abs( rd.y);
    float sR = RayleighAtt / zenithAngle ;
    float sM = MieAtt / zenithAngle ;

    vec3 inScatter = calcAtmosphericScattering(sR, sM, extinction, sundot, g);
    vec3 skyCol = inScatter*(1.0-extinction);

    // sky  
    vec3 col = skyCol; // *vec3(1.6,1.4,1.0)
    // sun
    col += 0.47*vec3(1.6,1.4,1.0)*pow( sundot, 350.0 ) * extinction;
    // sun haze
    col += 0.4*vec3(0.8,0.9,1.0)*pow( sundot, 2.0 ) * extinction;
    
    // sun scatter
    col += 0.3*vec3(1.0,0.7,0.3)*pow( sundot, 8.0 );

    // gamma
    //col = sqrt(col);
            
    col = ACESFilm(col);
    col = pow(col, vec3(Gamma));
    return col;
}
void main() {
    vec3 rd = normalize(v_texcoord.xyz);
    vec3 light_dir = vec3(1.0, 10.0, 1.0);
    vec3 color = getSkyColor(rd, normalize(light_dir));
    gl_FragColor = vec4(color, 1.0);
}