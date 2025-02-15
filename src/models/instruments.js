import { Model, fields } from 'catwalk';

export const waveType = {
    SQUARE: 1,
    TRIANGLE: 2,
    SINE: 3,
    NOISE: 4,
    SAMPLE: 5,
}

export class Wave extends Model([
    new fields.EnumField('waveType', {choices: [
        [waveType.SQUARE, "Square"],
        [waveType.TRIANGLE, "Triangle"],
        [waveType.SINE, "Sine"],
        [waveType.NOISE, "Noise"],
        // [waveType.SAMPLE, "Sample"],
    ], default: waveType.SQUARE}),
    new fields.ValueField('name', {default: ""}),
    new fields.IntegerField('transpose', {default: 0, min: -24, max: 24}),
    new fields.IntegerField('slideStep', {default: 0, min: -256, max: 256, label: "Pitch slide step"}),
    new fields.IntegerField('decayTo', {default: 0, min: 0, max: 15, label: "Decay to volume"}),
    new fields.IntegerField('decaySpeed', {default: 16, min: 0, max: 256}),
    new fields.IntegerField('phaseMin', {default: 16, min: 0, max: 32}),
    new fields.IntegerField('phaseMax', {default: 16, min: 0, max: 32}),
    new fields.IntegerField('phasePeriod', {default: 16, min: 0, max: 256}),
    new fields.IntegerField('vibratoDepth', {default: 0, min: 0, max: 256}),
    new fields.IntegerField('vibratoPeriod', {default: 16, min: 0, max: 256}),
    new fields.ListField(
        'harmonics',
        new fields.NumberField('harmonic', {default: 0, min: 0, max: 1}),
        {length: 8, default: [1, 0, 0, 0, 0, 0, 0, 0]},
    ),
]) {
    sampleWaveforms = ['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'IJOMPPPPMJHEEDFFGHIIIIKKKKHFDFGI', 'JLMPPPPNLJIGFEFEFGGGHJJKKIGGEDEH', 'IKMPPPOMKIIGFGFFGGGHHHJJIHHFEDEH', 'IKNPPPOMKJIGFFFFGFGHHHJJIIGGEEFI', 'JLPPPONLJIGGGFFFFGGGHIIIIGGEDEHI', 'ILOPPONMKIHGGFFFFGGGIIIJIHGEDEFI', 'ILOPPONLKIHHGFFFFGFGIIIJIHGEDEFI', 'JLOPPOOLKIHHFFFFFGFGHIIJIIGEEDFI', 'JMPPPOMLKIHGFGFFFGGGHIJJJIGEDDGI', 'ILOPPPNMKJIGGGFFGFGGGIJJIIGFDDEH', 'IMOPPPNLKJIGGFFFFFGGGIJJJHGEDDEH', 'IMOPPONMKJIHGFFFFGFGHIJJIHGEDCEI', 'JLPPPONLKJIHGFFFFFFGHIJJIHGEDCEI', 'IMOPPPNLKJIHGFFFFFFGHIJJJIHEDCEI', 'JMPPPONLKJIHGFFFGGFFHIJJIIHEDCEI', 'IMPPPONLKJIHGGFFGFFFHJJJIIGFCDEI', 'IMOPPONLLJIIGGFFFFFFHIJJJIGEDCEI', 'JMOPPONLKJJHGGFFFFEFHJJJJIGECCFI', 'JMOPPONLKJIHHFFGGEEFHJJJJIGECCFI', 'IMOPPOMMLJJIHFFFGFEFHJJJJIGECCEH', 'JLNPPNNMKJJIGFFGFEEFIIIJJIGEBCFI', 'JLNPPONLLKJIHGGGFEDFIIIJIIHECDFI', 'JLNPOONMLKJIHGGGFEDFHIJJJIGEDCEI', 'ILOPPONMLKKIHGGGFDDFHIIJJIGECCEI', 'ILOOPONMLKKJHGGGFDDFHIIJJIGEDCEH', 'IMNPPONMLLKIGGGGEDDFHIIJJIGECCFH', 'JLOPONNMLLKIHGHGEDEFHIIJJHFDCEFI', 'ILOPPONMMLKJHGHGDCDFGHIJJIGDCDEI', 'JMOPOONMMLKJHHHFDDDFGHIJJIFDCDFI', 'JLOPPONNMLKIHHHEDDDFGHJJJHFDCDFI', 'JMOPPONNNMKIIIGEDCDFGHJJJHFDCDGI', 'JLOPPONNNMLJIIHEDCDEFHIJJHFDCDFI', 'ILNPPPONNNLJIIHFDCCEFGIJJHFDCDFH', 'JMNPPPOOOMLKJIGECCCEFHIJIHFDCCFI', 'ILNOOPOONNMKJIGECCCDFHIJIHFDCCFH', 'ILNOPOOONNMKKIGFCCCDEGIIIHFDCDEI', 'JMNOOOPONNMLKIHECCCDFHIIIGFDDDFI', 'ILNOOPPOOOMLKJHFDCBCEGHIHHGDDDFH', 'JKNNOPONOOMLKJHFDCCDEGIIHHFEDEFI', 'ILNNOPONONNLJJHFDCCDEGHHHGFEDEGI', 'JLMNPOOONONLKJHFDCCDEGHHHGEEDEGI', 'ILLNPOONOPNLKJHFDCCDEGGHHGFEDEGI', 'JLLNPOONOPNMKJHFDDCDEFGHGGFEDEGI', 'IKKMOOONOPOMLKIGECDDEFGHHGFEEFFI', 'IJKMOOMNOONMLJIGEDDDEFGGGGFEFFGI', 'IJKLNPNMOPOMMKJHEDDDDEFGGGGFEEGH', 'JKNONMOPONLLJHFEDDDEFFGGFFFEGIII', 'IKNPMMNPONMLKIGEDDDDEFGGGFFFGHII', 'IKONMMOPONMMKIGEEEDDEFFGFFFFGIHI', 'ILONMNOPONMLKHGEEDDDEEFFFFFFGIHI', 'ILNNLMOPONNMKIGFEEDDEEFFFFFFHHGH', 'ILOMLNPPONNMKIGFEEDDDEFFFFFGHHGI', 'IMOMMNPPONNMJIHFFEDDCEEEFEFGHGGI', 'JMNMMNPPNNNMKIGGFEDCCDDFFEGIHGGI', 'IMMLMNPONNNMKJHGGEDDCDEFEFGHHGFI', 'ILMMMNOONNNMLJIHGFECCDDEFEGHHGFH', 'JLMMMNPONNNMLJIHGFDCCCDEEFHHHFFI', 'JKMMMOPOOONNLJIIGGDCBBDDDFGHHFFI', 'IKLLMOPOONNMKJJIHGDCBBCDDFGHHFFI', 'IKLLMPOPNNNMKKJJIGDCBCCCEFHHGEGI', 'IKLLNOOONMNMKKJJIGECBCCCEFHIGEFH', 'IKKNNOOONNMLLKJJIGDBBBBCFGHHFFGI', 'JKKMNOONNNLLKKKKJGDCBBBDEGIGGFGI', 'IJKLNOONNMLLKKKKJHEDCCBDFHHHGFGI', 'IKKMNONNNLKKKKLKJGEDCBCDGHHHGFGI', 'IJKMNONNMLKKKKLLJGEDBBCEGHHHFFGI', 'IJLMONNMLKKKKLLLIGEDBBDFGHHGFFGI', 'IKLNONNMLKKJKLLKIGEDBBDFGHHHGFHI', 'IKLMNNMLKJJJJKLLJHFDBBDFGHIHGGHI', 'IJLMNNMLKJIIJKLLKHFDBBDEGHIIGGHI', 'IKLNNNMLJJIIJKLLKHGDBBDEGHIHGGHI', 'IKLNONMLJIIIJKLLKIGDBBCEGHIHGGGI', 'IKMOONMKJIHIJLMLKJGDBBCFGHIHGGGI', 'IKMOOOMKJIHIKLMLKJFCBBDFGHHGGGGI', 'ILNOONMKIHHIKMMLLIFDBCDEGHHGGFGI', 'ILNOONLJIHHIKMMMLIFCBCDFGHHGFFGI', 'IMOPPNLJHGHILMMMKIFCCCDFHHHGFFGI', 'ILOPPNMKHHHIKMMMLIGDCCDFGHHGFFFH', 'JLOPPOMJHHHJLMNNLIECCCDFGHGFEEFI', 'ILOPPOMJHHHJLNOONJFDCCDFGGGEDDFH', 'ILOPPOLJHHIJMOPOMIFDDDDFGGEDCDFI', 'IKNOPOLHFDDDEFGFECCDFILNOPNLIHHI', 'IKNOPNKHFEEEFGGFDCDEGJLNONMKIHHI', 'IKNOPNKIGFEEFGGFDDDEGILMNNLKIHHI', 'IKNOPNLIHFEEFGGEDCDEFIKMNMLKIHHI', 'IKNOPNLJHGFFFGGEDDDEFIKLMMLJIHHI', 'IKMPPNLKIGFFGGGFDDDEFHJLMLKJIHHI', 'IKNPONLKIGFGHGFEEDDEFHJLLLKJIGHI', 'ILOPONMKIHGHHHFEDDDEFHJKLKJIHGHI', 'ILOPONMLIHHHHHFEDDDDFHJKKKJIGGGI', 'ILOPONNLJHHIIHFEDCCDFHJKKKJIGGGI', 'IMOPOONLJIIIIHFEDDCDFHIJKKJHGFGI', 'ILOPPONLJIIIIHGEDCCDFHIJKKIHGFGI', 'IMOPPPNMKJJJIHFEDCBCEGIJKKIHGFGH', 'ILNPPPNMKJJJJIGFDCBCEGIJKJIHFFGH', 'JMOPPONLKJJJIIGEDCCDEGIJJJIGFFGI', 'ILNOOONLLKKKJIHFDBBCDGIJKJIGFFGI', 'ILMOOONMLLLLLKIFDBBCEGIJJIHFEEGI', 'JLMNNNMMLMMMLJHFDBBDFHIJIHGFEEGI', 'IKMNNNMLLMMMLJIFDBBDFHIJIHGFEEGI', 'IKMNNNMMMNNNLKHFCBBDGHIJIGFEEEGI', 'JKLMNMMLMNNNLKIECBCEGIJJHGFEEEGI', 'IKLMNMLLMNONMKIFCBCEGIIIIHFEDEGI', 'IKLMNMLMNOONMKHECBDEHIJIHGFDDEGI', 'IKMMMLLMOOONNKHDBCDFHIIIHGEDDEGI', 'IKMMMLLMOPOONLHCBBDFHIJIHGDCCEGI', 'IKMMLLMOPPPPNJECBCEHIJJIGECCCEGI', 'IKLKJKLNOPPOMIFDDDFHIJIIGEDCDEGI', 'IKKKJKLMNOPOMIFEEFGIJJJIFEDCDEGI', 'IKKJJKLMNOPOMIGEEFHIJJJIGEDCDEGI', 'IJJJIJKMNOPOMJGFFFHIJKJIGEDCDEGI', 'IJKLMOPOMKHGFGHIJKJIGEDCDEGIJJJI', 'IJKLNPPNLIGGGHIJKKJHFDCCDFHIJJII', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'];
    sampleVolumes = [0, 0, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 14, 14, 14, 14, 13, 13, 12, 12, 11, 11, 10, 10, 10, 10, 9, 10, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 8, 8, 7, 7, 7, 6, 6, 6, 7, 7, 8, 9, 10, 10, 11, 11, 11, 10, 9, 9, 9, 8, 7, 7, 6, 5, 6, 7, 7, 7, 7, 7, 7, 6, 6, 7, 7, 7, 7, 7, 6, 0];
    sampleFrequencies = [760, 987, 75, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 77, 78, 78, 78, 78, 78, 78, 78, 78, 78, 77, 78, 78, 78, 78, 78, 78, 78, 77, 77, 77, 77, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 78, 987];
    frameCount = 116;
    repeatFrom = 0; // 96;
    repeatLength = 40;
    baseNote = 27;

    getFrameCallback(originalFrequency) {
        const frequency = originalFrequency * 2**(this.transpose / 12);
        return (frame) => {
            const waveform = new Array(32);
            if (this.waveType == waveType.NOISE) {
                for (let i = 0; i < 32; i++) waveform[i] = 0;
            } else if (this.waveType == waveType.SAMPLE) {

                let waveIndex;
                if (frame < this.frameCount) {
                    waveIndex = frame;
                } else if (this.repeatFrom > 0) {
                    const indexWithinRepeat = (frame - this.frameCount) % this.repeatLength;
                    waveIndex = this.repeatFrom + indexWithinRepeat;
                } else {
                    // sample has ended
                    return {
                        frequency: 440,
                        volume: 0,
                        waveform: [
                            15,15,15,15, 15,15,15,15, 15,15,15,15, 15,15,15,15,
                            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
                        ],
                    };
                }
                const baseFreq = 440 * 2**((this.baseNote-33) / 12);
                const freqMultiplier = originalFrequency / baseFreq;

                const result = {
                    frequency: this.sampleFrequencies[waveIndex] * freqMultiplier,
                    volume: this.sampleVolumes[waveIndex],
                    waveform: this.sampleWaveforms[waveIndex].split('').map((c) => c.charCodeAt(0) - 65),
                };
                return result;
            } else {
                const phaseCentre = (this.phaseMin + this.phaseMax) / 2;
                const phaseAmplitude = (this.phaseMax - this.phaseMin) / 2;
                const phase = phaseCentre - phaseAmplitude * Math.cos(frame * 2 * Math.PI / this.phasePeriod);
                let waveFunc;
                switch (this.waveType) {
                    case waveType.SQUARE:
                        waveFunc = i => i < phase ? 7.5 : -7.5;
                        break;
                    case waveType.TRIANGLE:
                        waveFunc = i => i < phase ? 15 * i / phase - 7.5 : 15 * (32 - i) / (32 - phase) - 7.5;
                        break;
                    case waveType.SINE:
                        waveFunc = i => 7.5 * Math.sin(Math.PI * i / 16);
                        break;
                    default:
                        throw new Error("Unknown wave type");
                }
                for (let i = 0; i < 32; i++) {
                    let tot = 0;
                    for (let h = 0; h < 8; h++) {
                        const harmonic = this.harmonics[h];
                        tot += harmonic * waveFunc(i * (h + 1) % 32);
                    }
                    waveform[i] = Math.min(Math.max(0, Math.round(7.5 + tot)), 15);
                }
            }

            const finalFrequency = (
                frequency
                + this.vibratoDepth * Math.sin(frame * 2 * Math.PI / this.vibratoPeriod)
                + frame * this.slideStep / 16
            );

            return {
                frequency: Math.min(Math.max(1, Math.round(finalFrequency)), 4095),
                volume: Math.max(this.decayTo, 15 - (frame * this.decaySpeed / 16)),
                waveform,
            };
        }
    }

    getLuaCode() {
        const modifierStatements = [];
        const waveStatements = [];

        if (this.waveType == waveType.SAMPLE) {
            const baseFreq = 440 * 2**((this.baseNote-33) / 12);
            const isLooped = this.repeatFrom > 0;

            modifierStatements.push(`  local waves={${this.sampleWaveforms.map((w) => `"${w}"`).join(',')}}`);
            modifierStatements.push(`  local vols={${this.sampleVolumes.join(',')}}`);
            modifierStatements.push(`  local freqs={${this.sampleFrequencies.join(',')}}`);
            if (isLooped) {
                modifierStatements.push(`  if (t>=${this.frameCount}) then`);
                modifierStatements.push(`    t=(t-${this.frameCount})%${this.repeatLength}+${this.repeatFrom}`);
                modifierStatements.push(`  end`);
                modifierStatements.push(`  local w=waves[t+1]`);
                modifierStatements.push(`  v=v*vols[t+1]//15`);
                modifierStatements.push(`  f=freqs[t+1]*f//${baseFreq}`);
            } else {
                modifierStatements.push(`  local w="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"`);
                modifierStatements.push(`  if (t<${this.frameCount}) then`);
                modifierStatements.push(`    w=waves[t+1]`);
                modifierStatements.push(`    v=v*vols[t+1]//15`);
                modifierStatements.push(`    f=freqs[t+1]*f//${baseFreq}`);
                modifierStatements.push(`  else`);
                modifierStatements.push(`    v=0`);
                modifierStatements.push(`    f=440`);
                modifierStatements.push(`  end`);
            }
            waveStatements.push("    poke4(a*2+4+i,w:byte(i+1)-65)");
        } else {

            let usePhase = false;

            let clampFrequency = false;
            let clampWaveform = false;

            if (this.transpose != 0) {
                modifierStatements.push(`  f=f*${2**(this.transpose/12)}`);
                clampFrequency = true;
            }

            if (this.vibratoDepth > 0) {
                modifierStatements.push(`  f=f+${this.vibratoDepth}*math.sin(t*2*math.pi/${this.vibratoPeriod})`);
                clampFrequency = true;
            }

            if (this.slideStep != 0) {
                modifierStatements.push(`  f=f+t*${this.slideStep/16}`);
                clampFrequency = true;
            }

            if (clampFrequency) {
                modifierStatements.push(`  f=math.min(math.max(1,(f+0.5)//1),4095)`);
            }

            if (this.decaySpeed > 0) {
                modifierStatements.push(`  v=math.max(${this.decayTo}, 15-(t*${this.decaySpeed/16}))*v//15`);
            }

            if (this.waveType == waveType.NOISE) {
                waveStatements.push("    poke4(a*2+4+i,0)");
            } else {
                const waveTerms = [];

                switch (this.waveType) {
                    case waveType.SQUARE:
                        usePhase = true;
                        for (let h = 0; h < 8; h++) {
                            if (this.harmonics[h] == 0) continue;
                            let indexExpr;
                            if (h == 0) {
                                indexExpr = "i";
                            } else {
                                indexExpr = `(i*${h+1}%32)`;
                            }
                            const waveTerm = `${indexExpr}<p and 7.5 or -7.5`;
                            if (this.harmonics[h] == 1) {
                                waveTerms.push(waveTerm);
                            } else {
                                waveTerms.push(`${this.harmonics[h]}*(${waveTerm})`);
                                clampWaveform = true;
                            }
                        }
                        break;
                    case waveType.TRIANGLE:
                        usePhase = true;
                        for (let h = 0; h < 8; h++) {
                            if (this.harmonics[h] == 0) continue;
                            let indexExpr;
                            if (h == 0) {
                                indexExpr = "i";
                            } else {
                                indexExpr = `(i*${h+1}%32)`;
                            }
                            const waveTerm = `15*(${indexExpr}<p and ${indexExpr}/p or (32-${indexExpr})/(32-p))-7.5`
                            if (this.harmonics[h] == 1) {
                                waveTerms.push(waveTerm);
                            } else {
                                waveTerms.push(`${this.harmonics[h]}*(${waveTerm})`);
                                clampWaveform = true;
                            }
                        }
                        break;
                    case waveType.SINE:
                        for (let h = 0; h < 8; h++) {
                            if (this.harmonics[h] == 0) continue;
                            let indexExpr;
                            if (h == 0) {
                                indexExpr = "i";
                            } else {
                                indexExpr = `(i*${h+1}%32)`;
                            }
                            const waveTerm = `7.5*math.sin(math.pi*${indexExpr}/16)`;
                            if (this.harmonics[h] == 1) {
                                waveTerms.push(waveTerm);
                            } else {
                                waveTerms.push(`${this.harmonics[h]}*(${waveTerm})`);
                                if (this.harmonics[h] > 1) clampWaveform = true;
                            }
                        }
                        break;
                    default:
                        throw new Error("Unknown wave type");
                }

                if (usePhase) {
                    const phaseCentre = (this.phaseMin + this.phaseMax) / 2;
                    const phaseAmplitude = (this.phaseMax - this.phaseMin) / 2;
                    if (phaseAmplitude > 0) {
                        modifierStatements.push(`  local p=${phaseCentre}-${phaseAmplitude}*math.cos(t*2*math.pi/${this.phasePeriod})`);
                    } else {
                        modifierStatements.push(`  local p=${phaseCentre}`);
                    }
                }

                if (waveTerms.length == 1) {
                    if (clampWaveform) {
                        waveStatements.push(`    poke4(a*2+4+i,math.min(15,math.max(0,7.5+(${waveTerms[0]}))))`);
                    } else {
                        waveStatements.push(`    poke4(a*2+4+i,7.5+(${waveTerms[0]}))`);
                    }
                } else {
                    waveStatements.push(`    local r=0`);
                    for (let i = 0; i < waveTerms.length; i++) {
                        waveStatements.push(`    r=r+${waveTerms[i]}`);
                    }
                    waveStatements.push(`    poke4(a*2+4+i,math.min(15,math.max(0,7.5+r)))`);
                }
            }
        }

return `function (c,v,f,t)
  -- ${this.name}
  local a=0xff9c+c*18
${modifierStatements.join('\n')}
  poke(a,f&255)
  poke(a+1,(v<<4)+(f>>8))
  for i=0,31 do
${waveStatements.join('\n')}
  end
end
`;
    }
}
