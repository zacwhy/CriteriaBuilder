
(function ( $ ) {

var constCreateFilter = "+";
var constRemoveFilter = "-";
var constLogicOperatorAll = "all";
var constLogicOperatorAny = "any";
var constField = "field";

var _fields;
var _onChange;
var rootListItem;

function getFieldsCount() {
    return _fields.length;
}

function getFieldByIndex(index) {
    return _fields[index];
}

function getFieldByName(name) {
    var i;
    for (i in _fields) {
        var field = _fields[i];
        if (field.name == name) {
            return field;
        }
    }
    return null;
}

function getHtmlSelectField(li) {
    return li.children('select:first');
}

function getHtmlSpanParameters(li) {
    return li.children('span');
}

function getHtmlUlCriteriaList(li) {
    return li.children('ul');
}

function getType(index) {
    switch (index) {
        case 0: return constLogicOperatorAll;
        case 1: return constLogicOperatorAny;
    }
    return constField;
}

$.fn.criteriaBuilder = function (options) {
    var settings = $.extend({
        fields: null,
        onChange: null
    }, options);

    _fields = settings.fields;
    _onChange = settings.onChange;

    var rootButton = $('<input>').attr('type', 'button').val(constCreateFilter).addClass('short-button')
    rootButton.click(function () {
        var button = $(this);
        if (button.val() == constCreateFilter) {
            appendSelectFieldAndSpanParameter(rootListItem, constLogicOperatorAll, false, null);
            button.val(constRemoveFilter);
            triggerChangeEvent();
        } else if (button.val() == constRemoveFilter) {
            getHtmlSelectField(rootListItem).remove();
            getHtmlSpanParameters(rootListItem).remove();
            getHtmlUlCriteriaList(rootListItem).remove();
            button.val(constCreateFilter);
            _onChange("");
        }
    });

    rootListItem = $('<li>');
    rootListItem.html(rootButton);

    var rootList = $('<ul>');
    rootList.html(rootListItem);

    var rootElement = this;
    return rootElement.html(rootList);
}

function appendSelectFieldAndSpanParameter(htmlElement, selectedType, includeFields, selectedFieldName) {
    var htmlSelect = getNewHtmlSelectFields(selectedType, includeFields, selectedFieldName);
    var htmlSpan = $('<span>');

    htmlSelect.change(function () {
        var select = $(this);
        var selectedIndex = select.prop('selectedIndex');
        var type = getType(selectedIndex);
        var fieldName = null;

        if (type == constField) {
            var selectedValue = select.val();
            fieldName = selectedValue;

            var li = select.parent();
            var ul = getHtmlUlCriteriaList(li);
            ul.remove();
        }

        populateParameters(htmlSpan, type, fieldName);
        triggerChangeEvent();
    });

    htmlElement.append(htmlSelect);
    htmlElement.append(htmlSpan);
    populateParameters(htmlSpan, selectedType, selectedFieldName);
}

function getNewHtmlSelectFields(selectedType, includeFields, selectedName) {
    var select = $('<select>');

    var optionAll = $('<option>').html('All');
    var optionAny = $('<option>').html('Any');

    if (includeFields) {
        var optgroupLogic = $('<optgroup>').attr('label', 'Logic').append(optionAll).append(optionAny);
        select.append(optgroupLogic);

        var optgroupFields = $('<optgroup>').attr('label', 'Fields');
        var i;
        for (i = 0; i < getFieldsCount(); i++) {
            var field = getFieldByIndex(i);
            var option = $('<option>').attr('value', field.name).html(field.display);
            if (field.name == selectedName) {
                option.attr('selected', 'selected');
            }
            optgroupFields.append(option);
        }
        select.append(optgroupFields);
    } else {
        select.append(optionAll).append(optionAny);
    }

    return select;
}

function getNewHtmlLiCriterion(type, selectedFieldName) {
    var addButton = $('<input>').attr('type', 'button').val('+').addClass('short-button');
    addButton.click(function () {
        var button = $(this);
        var li = button.parent();
        var select = getHtmlSelectField(li);
        var selectedValue = select.val();
        var newLi = getNewHtmlLiCriterion(constField, selectedValue);
        newLi.insertAfter(li);

        var ul = li.parent();
        ul.find('input[value="-"]').removeAttr('disabled');

        triggerChangeEvent();
    });

    var removeButton = $('<input>').attr('type', 'button').val('-').addClass('short-button').attr('disabled', 'disabled');
    removeButton.click(function () {
        var button = $(this);
        var li = button.parent();
        var ul = li.parent();
        li.remove();

        var lis = ul.children();
        if (lis.length == 1) {
            lis.children('input[value="-"]').attr('disabled', 'disabled');
        }

        triggerChangeEvent();
    });

    var li = $('<li>');
    li.append(addButton);
    li.append(removeButton);

    appendSelectFieldAndSpanParameter(li, type, true, selectedFieldName);

    return li;
}

function getParameterTextForLogicOperator(type) {
    switch (type) {
        case constLogicOperatorAll: return ' of the following are true';
        case constLogicOperatorAny: return ' of the following is true';
    }
}

function populateParameters(htmlSpan, type, selectedFieldName) {
    if (type == constLogicOperatorAll || type == constLogicOperatorAny) {
        htmlSpan.html(getParameterTextForLogicOperator(type));

        var li = htmlSpan.parent();
        var uls = li.children('ul');

        if (uls.length == 0) {
            var field = getFieldByIndex(0);
            var name = field.name;
            var newLi = getNewHtmlLiCriterion(constField, name);
            var ul = $('<ul>').append(newLi);
            li.append(ul);
        }

        return;
    }

    var field = getFieldByName(selectedFieldName);

    var result;
    switch (field.type) {
        case "boolean":
            var select = $('<select>')
                .append($('<option>').html('true').val('true').attr('selected', 'selected'))
                .append($('<option>').html('false').val('false'));
            select.change(function () {
                triggerChangeEvent();
            });

            htmlSpan.html(' is ').append(select);
            break;

        case "integer":
            var select = $('<select>')
                .append($('<option>').html('less than').val('<'))
                .append($('<option>').html('equal to').val('=').attr('selected', 'selected'))
                .append($('<option>').html('greater than').val('>'));
            select.change(function () {
                triggerChangeEvent();
            });

            var input = $('<input>');
            input.keyup(function () {
                triggerChangeEvent();
            });

            htmlSpan.html(' is ').append(select).append(input);
            break;

        case "date":
            var select = $('<select>')
                .append($('<option>').html('before').val('<'))
                .append($('<option>').html('on').val('=').attr('selected', 'selected'))
                .append($('<option>').html('after').val('>'));
            select.change(function () {
                triggerChangeEvent();
            });

            var input = $('<input>');
            input.keyup(function () {
                triggerChangeEvent();
            });

            htmlSpan.html(' is ').append(select).append(input);
            break;

        case "string":
            var select = $('<select>')
                .append($('<option>').html('contains').val('Contains').attr('selected', 'selected'))
                .append($('<option>').html('begins with').val('BeginsWith'))
                .append($('<option>').html('ends with').val('EndsWith'))
                .append($('<option>').html('is').val('Is'))
                .append($('<option>').html('does not contain').val('DoesNotContain'))
                .append($('<option>').html('does not begin with').val('DoesNotBeginWith'))
                .append($('<option>').html('does not end with').val('DoesNotEndWith'))
                .append($('<option>').html('is not').val('IsNot'));
            select.change(function () {
                triggerChangeEvent();
            });

            var input = $('<input>');
            input.keyup(function () {
                triggerChangeEvent();
            });

            htmlSpan.html(select).append(input);
            break;

        case "enum":
            var selectCondition = $('<select>')
                .append($('<option>').html('is').val('=').attr('selected', 'selected'))
                .append($('<option>').html('is not').val('<>'));
            selectCondition.change(function () {
                triggerChangeEvent();
            });

            var values = field.values;
            var selectValues = $('<select>');
            var i;
            for (i in values) {
                var value = values[i];
                var option = $('<option>').attr('value', value).html(value);
                selectValues.append(option);
            }
            selectValues.change(function () {
                triggerChangeEvent();
            });

            htmlSpan.html(selectCondition).append(selectValues);
            break;
    }
}

function triggerChangeEvent() {
    var criteriaString = getCriteriaString(rootListItem);
    _onChange(criteriaString);
}

function getCriteriaString(li) {
    var select = getHtmlSelectField(li);
    var span = getHtmlSpanParameters(li);

    var selectedIndex = select.prop('selectedIndex');
    var type = getType(selectedIndex);

    if (type == constField) {
        var fieldName = select.val();
        var field = getFieldByName(fieldName);
        return getParametersToString(li, field);
    } else if (type == constLogicOperatorAll || type == constLogicOperatorAny) {
        var operator = type == constLogicOperatorAll ? "and" : "or"; //todo
        var ul = getHtmlUlCriteriaList(li);
        var lis = ul.children('li');

        var result = "";
        var criteriaCount = 0;
        lis.each(function (/*index*/) {
            var criteriaString = getCriteriaString($(this));
            if (criteriaString != null) {
                if (criteriaCount > 0) {
                    result += " " + operator + " ";
                }
                result += criteriaString;
                criteriaCount++;
            }
        });

        if (criteriaCount == 0) {
            return null;
        }

        return "(" + result + ")";
    }
}

function getParametersToString(li, field) {
    var span = getHtmlSpanParameters(li);

    switch (field.type) {
        case "boolean":
            var selectValue = span.children('select:first');
            return field.name + " = " + selectValue.val();

        case "integer":
            var inputValue = span.children('input:first');
            if (inputValue.val() == "") {
                return null;
            }
            var selectCondition = span.children('select:first');
            return field.name + " " + selectCondition.val() + " " + inputValue.val();

        case "date":
            var inputValue = span.children('input:first');
            if (inputValue.val() == "") {
                return null;
            }
            var selectCondition = span.children('select:first');
            return field.name + " " + selectCondition.val() + " '" + inputValue.val() + "'";

        case "string":
            var inputValue = span.children('input:first');
            if (inputValue.val() == "") {
                return null;
            }
            var selectCondition = span.children('select:first');
            var condition = selectCondition.val();
            var value = inputValue.val();
            return field.name + " " + getConditionAndValue(condition, value);

        case "enum":
            var selectCondition = span.children('select:first');
            var selectValue = span.children('select:nth-child(2)');
            return field.name + " " + selectCondition.val() + " '" + selectValue.val() + "'";
    }

    //return "UNHANDLED EXCEPTION";
}

function getConditionAndValue(condition, value) {
    switch (condition) {
        case "Contains":
            return "like '%" + value + "%'";
        case "BeginsWith":
            return "like '" + value + "%'";
        case "EndsWith":
            return "like '%" + value + "'";
        case "Is":
            return "= '" + value + "'";
        case "DoesNotContain":
            return "not like '%" + value + "%'";
        case "DoesNotBeginWith":
            return "not like '" + value + "%'";
        case "DoesNotEndWith":
            return "not like '%" + value + "'";
        case "IsNot":
            return "<> '" + value + "'";
    }

    //return "UNHANDLED EXCEPTION";
}

}) ( jQuery );
