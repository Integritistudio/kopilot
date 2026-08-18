const RELATIONS = {
    spouse: "Spouse",
    parent: "Parent",
    family: "Family",
    friend: "Friend",
    other: "Other"
}
const medicalEnum = [
    "None",
    "Asthma",
    "Epilepsy",
    "Type 1 Diabetes",
    "Type 2 Diabetes",
    "Autism",
    "Non-Verbal",
    "Hearing Impaired",
    "Pace Maker",
    "Heart Condition",
    "COPD",
    "Hypertension",
    "Kidney Disease",
    "Celiac",
    "Other"
];

const allergiesEnum = [
    "None",
    "Peanuts/Tree Nuts",
    "Fish/Shellfish",
    "Bees",
    "Latex",
    "NSAIDs (Aspirin, Ibuprofen)",
    "Pain Medications",
    "Penicillin",
    "Amoxacylin",
    "Insulin",
    "Opioids",
    "Epinephrine",
    "Ketamine",
    "Other"
];

const medicationsEnum = [
    "NONE",
    "NSAIDS",
    "PENICILLIN",
    "ANTIPSYCHOTICS",
    "ANTIBIOTICS",
    "BLOOD_THINNERS",
    "ANTIPLATELETS",
    "INSULIN",
    "HYPOGLYCEMICS",
    "INHALED_STEROIDS",
    "ORAL_STEROIDS",
    "BETA_BLOCKERS",
    "NITRATES",
    "ACE_INHIBITORS",
    "OTHER"
];

window.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_EMERGENCY_ERROR = 'Tag not found or Medical Id disabled';

    function getUrlTagId() {
        try {
            return new URLSearchParams(window.location.search).get('t') || '';
        } catch (e) {
            return '';
        }
    }

    function getTagId() {
        try {
            const fromUrl = getUrlTagId();
            if (fromUrl) {
                localStorage.setItem('tagId', JSON.stringify(fromUrl));
                return fromUrl;
            }

            const stored = localStorage.getItem('tagId');
            if (!stored) return null;

            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    }

    const urlTagId = getUrlTagId();

    function readApiErrorMessage(payload) {
        if (!payload || typeof payload !== 'object') return '';
        return payload.message || payload.error || payload.errorMessage || payload.msg || '';
    }

    function showEmergencyError(err) {
        try {
            const raw = err && typeof err.message === 'string' ? err.message.trim() : '';
            const isEngineError = /cannot read|undefined is not|null is not|failed to fetch|networkerror|missing tag|something went wrong/i.test(raw);
            const message = raw && !isEngineError ? raw : DEFAULT_EMERGENCY_ERROR;

            const banner = document.querySelector('[data-emergency-error-banner]');
            const popup = document.querySelector('[data-emergency-error-popup]');
            const texts = document.querySelectorAll('[data-emergency-error-text]');

            texts.forEach((el) => {
                el.textContent = message;
            });

            if (banner) {
                banner.hidden = false;
                banner.classList.add('is-visible');
            }

            if (popup) {
                popup.hidden = false;
                popup.classList.add('is-open');
                popup.setAttribute('aria-hidden', 'false');
                document.body.classList.add('emergency-error-open');
            }
        } catch (e) {}
    }

    function closeEmergencyErrorPopup() {
        try {
            const popup = document.querySelector('[data-emergency-error-popup]');
            if (!popup) return;
            popup.classList.remove('is-open');
            popup.setAttribute('aria-hidden', 'true');
            popup.hidden = true;
            document.body.classList.remove('emergency-error-open');
        } catch (e) {}
    }

    document.querySelectorAll('[data-emergency-error-close]').forEach((el) => {
        el.addEventListener('click', (event) => {
            event.preventDefault();
            closeEmergencyErrorPopup();
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeEmergencyErrorPopup();
    });

    async function getToken() {
        const sectionTagId = getTagId();
        if (!sectionTagId) {
            throw new Error(DEFAULT_EMERGENCY_ERROR);
        }

        const authToken = await fetch('https://api.kopilot.id/auth/token/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': '2U8BFSHig59Np7Wmou3cgdMjkVnC77HY'
            }
        });

        const response = await authToken.json();
        const token = await response.data.token;
        const userInfo = await fetch(`https://api.kopilot.id/tag/scan/${sectionTagId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-scan-session': token
            }
        })
        return await userInfo.json();
    }

    getToken().then((response) => {
        const empty = '--';
        const notSpecified = '<None Specified>';

        if (!response.data) {
            throw new Error(readApiErrorMessage(response) || DEFAULT_EMERGENCY_ERROR);
        }

        const data = response.data.medicalId;
        if (!data) {
            throw new Error(readApiErrorMessage(response) || DEFAULT_EMERGENCY_ERROR);
        }

        const summary = document.querySelector('.summary-content');
        const summaryBlock = document.querySelector('.summary.emergency-block');
        const personalInformation = document.querySelector('.emergency-info');

        if (data.summary === null && summary.innerText.trim() === '-') {
            summaryBlock.remove();
            personalInformation.classList.add('empty-summary', 'emergency-block')
        } else {
            summary.innerText = data.summary;
        }
        document.querySelector('.personal-information__content .name').textContent = data.name;
        document.querySelector('.personal-information__content .gender').textContent = data.genderIndex === 1 ? "Male"
            : data.genderIndex === 2 ? "Female" : data.genderIndex === 3 ? "Other" : empty;

        const weight = document.querySelector('.personal-information__content .weight');
        const height = document.querySelector('.personal-information__content .height');

        const weightNum = data.weight;
        const heightNum = data.height;

        const lbConvert = 2.20462;

        if (weightNum > 0) {
            const rawLb = weightNum * lbConvert;
            const lb = Math.round(rawLb / 10) * 10;
            weight.innerText = `${lb} LB`;
        }

        if (heightNum > 0) {
            const totalInches = Math.round(heightNum / 2.54);
            const feet = Math.floor(totalInches / 12);
            const inches = totalInches % 12;
            height.innerText = `${feet}′ ${inches}″`;
        }

        if (data.summary != null) {
            const mapTranslate = document.querySelector('.summary-header__icon-translate');

            const href = mapTranslate.getAttribute('href');
            const makeArr = Array.from(href)
            makeArr.push(data.summary)
            let joinValue = ''
            for (let str of makeArr) {
                joinValue += str;
            }
            mapTranslate.setAttribute('href', joinValue)
        }

        const medicalCondition = decodeMedicalConditions(data.medicalConditionsMask, medicalEnum);
        const allergies = decodeMedicalConditions(data.allergiesMask, allergiesEnum);
        const medications = decodeMedicalConditions(data.medicationsMask, medicationsEnum);

        function addCommaAtTheEnd(array, b) {
            console.log('array', array);

            if (array.length === 0) {
                return b !== '' ? b : '';
            }

            let convert = [];

            for (let i = 0; i < array.length; i++) {
                const arr = array[i];
                if (i !== array.length - 1) {
                    convert.push(`${arr}, `);
                } else {
                    convert.push(arr);
                }
            }

            if (b !== '') {
                convert[convert.length - 1] += `: ${b}`;
            }

            return convert.join('');
        }

        document.querySelector(' .medical-conditions').textContent =
            medicalCondition.length ? addCommaAtTheEnd(medicalCondition, data.medicalConditionsOther) : notSpecified;

        document.querySelector('.allergies').textContent = data.allergiesOther !== "" || allergies.length ?
            addCommaAtTheEnd(allergies, data.allergiesOther) : notSpecified;

        document.querySelector('.medications').textContent =
            data.medicationsOther !== "" || medications.length ? addCommaAtTheEnd(medications, data.medicationsOther) : notSpecified;

        document.querySelector('.personal-information__content .age').textContent =
            data.ageRangeIndex > 0 ? data.ageRangeIndex - 1 + '0' + 'S' : empty;
        document.querySelector('.medical-content .help').textContent = data.notes !== "" ? data.notes : notSpecified;

        document.querySelector('.emergency-section__desc.emergency-name').textContent = data.emergencyContactName !== "" ? data.emergencyContactName : empty;

        const phone = document.querySelector('.emergency-section__desc.phone');
        phone.textContent = data.emergencyContactPhone !== "" ? data.emergencyContactPhone : empty;

        if (data.emergencyContactPhone === "") {
            phone.style.color = '#000000'
        } else {
            phone.style.color = '#f20008'
        }

        if (data.emergencyContactPhone !== "") {
            document.querySelector('.emergency-section__desc.phone').setAttribute('href', `tel:${data.emergencyContactPhone}`);
        }

        const domHTmlElement = document.querySelector('.emergency-name');
        if (domHTmlElement.innerText !== '') {
            domHTmlElement.innerText = domHTmlElement.innerText + ` (${findRelations(data.emergencyContactRelationIndex)})`;
        }

        function findRelations(relationIndex) {
            if (relationIndex === 1) {
                return RELATIONS.spouse
            } else if (relationIndex === 2) {
                return RELATIONS.parent
            } else if (relationIndex === 3) {
                return RELATIONS.family
            } else if (relationIndex === 4) {
                return RELATIONS.friend
            } else if (relationIndex === 5) {
                return RELATIONS.other
            } else {
                return empty
            }
        }

        // Знаходимо наші елементи (або створи їх через JS, якщо не міняв Liquid)
const summaryTextElement = document.querySelector('.summary-content');

if (data.summary || data.emergencyContactName) {
    // 1. Формуємо текст AI резюме (як було)
    let summaryHtml = `<p>${data.summary || ''}</p>`;

    // 2. Формуємо блок контактів (як на скріншоті)
    if (data.emergencyContactName || data.emergencyContactPhone) {
        const relation = findRelations(data.emergencyContactRelationIndex);
        const phone = data.emergencyContactPhone || '';
        
        summaryHtml += `
            <div class="summary-emergency-snapshot" style="margin-top: 20px;">
                <h3 style="text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">Emergency Contact</h3>
                <p style="margin: 0;">${data.emergencyContactName} (${relation})</p>
                <p style="margin: 0;">Phone: <a href="tel:${phone}" style="color: #f20008; text-decoration: underline;">${phone}</a></p>
            </div>
        `;
    }

    summaryTextElement.innerHTML = summaryHtml;
} else {
    // Якщо взагалі нічого немає — видаляємо блок
    summaryBlock.remove();
}


    }).catch((err) => {
        try {
            const summary = document.querySelector('.summary-content');
            const summaryBlock = document.querySelector('.summary.emergency-block');
            const personalInformation = document.querySelector('.emergency-info');

            if (summary && summaryBlock && personalInformation && summary.innerText.trim() === '-') {
                summaryBlock.remove();
                personalInformation.classList.add('empty-summary', 'emergency-block');
            }
        } catch (e) {}

        showEmergencyError(err);
    })


    function decodeMedicalConditions(mask, enums) {
        const selected = [];

        for (let i = 0; i < enums.length; i++) {
            const bit = 1 << i;
            if ((mask & bit) !== 0) {
                if (enums[i].includes('_')) {
                    const changed = enums[i].split('_').join(' ')
                    selected.push(changed);
                } else {
                    selected.push(enums[i]);
                }
            }
        }

        return selected;
    }

    if (window.innerWidth <= 768) {
        document.querySelector('.emergency-banner__container').addEventListener('click', () => {
          window.scrollTo({
                top: 160,
                behavior: 'smooth'
            });
            // const section_emergency = document.querySelector('.emergency-banner__container');

            // const emergencySection = document.querySelector('.emergency-section');

            // section_emergency.classList.add('animate-in');

            // if (emergencySection != null) {
            //     emergencySection.classList.add('new_mobile')
            // }

        })
    }

})