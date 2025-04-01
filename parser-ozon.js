/*
	Запуск: открываем страницу нужного xxxx-xxxx продавца, https://www.ozon.ru/seller/xxxxx-xxxx/products/?miniapp=seller_xxxx
	F12 > Sources > Snippets > Ctrl+Enter
	result file: C:\Users\user-xxx\Downloads\ozon-last.txt
*/
async function doScroll (height) {
    //window.scrollTo(0, height);
    // прокручиваем страницу плавно:
    window.scrollTo({
        top: height,
        left: 0,
        behavior: "smooth"
    });
}

async function delay(ms) { // задержка в милисекндах
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
}

function check_scroll(oldheight, height){
    console.log("height: " + oldheight + " scrollHeight: " + height);
}

function saveFile(file) { 
//https://ru.stackoverflow.com/questions/667555/%d0%9e%d1%82%d0%ba%d1%80%d1%8b%d1%82%d1%8c-%d1%84%d0%b0%d0%b9%d0%bb-%d0%b2-js-%d0%bd%d0%b0%d0%b9%d1%82%d0%b8-%d1%81%d1%82%d1%80%d0%be%d0%ba%d1%83-%d0%b8-%d0%b4%d0%be%d0%bf%d0%be%d0%bb%d0%bd%d0%b8%d1%82%d1%8c-%d0%b5%d0%b5-%d0%97%d0%b0%d0%bf%d0%b8%d1%81%d0%b0%d1%82%d1%8c-%d1%84%d0%b0%d0%b9%d0%bb
//https://ru.stackoverflow.com/questions/927256/%D0%9A%D0%B0%D0%BA-%D1%81%D0%BE%D0%B7%D0%B4%D0%B0%D1%82%D1%8C-%D0%B8-%D1%81%D0%BE%D1%85%D1%80%D0%B0%D0%BD%D0%B8%D1%82%D1%8C-%D1%84%D0%B0%D0%B9%D0%BB-%D0%B2-js-%D0%BD%D0%B0-%D0%BA%D0%BB%D0%B8%D0%B5%D0%BD%D1%82%D0%B5
    
    let url = URL.createObjectURL(file);

    let a = document.createElement('a');
    a.download = file.name;
    a.href = url;
    a.click();

    // очищаем object URL
    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 2000);
}

function saveText(newtext) {
    let file_name = "ozon-last.txt";

    let file = new File([newtext], file_name, { type: 'plain/text' });
    //console.log(file);
    // пытаемся сохранить
    if (!window.saveAs) {
        saveFile(file);//, blob);
        console.log("saveFile(file) - OK");
    } else {
        let blob = new Blob([newtext], { type: 'plain/text' });
        window.saveAs(blob, file_name);
        console.log("window.saveAs(blob, file_name) - OK");
    }
}

async function getData(key) {

    let elss = document.evaluate(
        '//div[@id="contentScrollPaginator"]//div[@data-index]//span[@class="tsBody500Medium"]',
        document.body,
        null,
        XPathResult.ANY_TYPE,
        null,
    );
    let thisEl = elss.iterateNext();
    let cnt = 0;
    let newtext = '';
    while (thisEl) {

        let parent1 = thisEl.parentElement.parentElement;
        let prev1 = parent1.previousElementSibling;
        let price1 = prev1.querySelector('span').textContent;
        if(price1 === 'Стало дешевле'){
            prev1 = prev1.previousElementSibling;
            price1 = prev1.querySelector('span').textContent;
        }
        price1 = price1.replace(/&thinsp;/gi, '').replace('₽', '').replace(' ', '').replace(/&nbsp;/gi,'').replace(/\s/g, '').replace(/\u00A0/g, '');
        //console.log(thisEl.textContent+'|'+price1);
        newtext += thisEl.textContent+'|'+price1 + '\r\n';
        cnt++;
        thisEl = elss.iterateNext();
    }

    localStorage.setItem(key, newtext); // предварительно сохраняем то, что удалось спарсить в localStorage
    console.log("total processed items: " + cnt + ' localStorage key :' + key);

}

let run = async () => {
    let height = 0,
        i = 0, ht0 = 1000, ht= 0,
        newtext = '', key = 0;
    localStorage.clear(); // очищаем хранилище от старых данных
    window.scrollTo(0, 0);
    while (ht < document.body.scrollHeight) {
        await delay(1000);
        let oldheight = height;
        height = document.body.scrollHeight;
        ht += ht0;
        await doScroll(ht);//height);
        await delay(500);
        check_scroll(oldheight, height);
        if(i++ >= 5) { // после каждых 6-ти прокруток (можно умешьшить или увеличить это значение) пытаемся парсить то, что даюти сохранчяем в localStorage
            await delay(100);
            console.log("i=" + i);
            i = 0;
            let skey = '' + key;
            await getData(skey);
            key++;
        }
    }
    await delay(100);
    for(let i = 0; i < key; i++){
        let skey = '' + i;
        newtext += localStorage.getItem(skey); // считываем все данные из хранилища, там будет много дублей
    }
    // Уникализируем данные
    let prods = newtext.split('\r\n');
    let unic_prods = new Set(prods);
    newtext = Array.from(unic_prods).join('\r\n');
    saveText(newtext); // сохраняем уникальные строки в файл ozon-last.txt на диске ПК (у меня он попапает в папку Загрузки)
    console.log("run end OK!");

}

run();
